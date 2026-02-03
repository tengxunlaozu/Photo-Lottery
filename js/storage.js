/**
 * 本地存储管理模块
 * 使用 IndexedDB 存储照片大文件，localStorage 存储配置等轻量数据
 */
const Storage = {
    DB_NAME: 'LotteryDB',
    STORE_NAME: 'photos',
    db: null,

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            request.onerror = () => reject('数据库打开失败');
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'name' });
                }
            };
        });
    },

    /**
     * 保存单张照片到 IndexedDB
     */
    async savePhoto(name, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put({ name, data });
            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    },

    /**
     * 从 IndexedDB 获取所有已导入的照片
     */
    async getAllPhotos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject();
        });
    },

    /**
     * 清空已导入的照片
     */
    async clearPhotos() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    },

    /**
     * 保存奖项配置到 localStorage
     */
    savePrizeConfig(config) {
        localStorage.setItem('prizeConfig', JSON.stringify(config));
    },

    /**
     * 获取奖项配置，若无则返回默认值
     */
    getPrizeConfig() {
        const defaultPrizes = [
            { id: 'special', name: '特别奖', count: 1, enabled: true },
            { id: 'grand', name: '特等奖', count: 1, enabled: true },
            { id: 'first', name: '一等奖', count: 3, enabled: true },
            { id: 'second', name: '二等奖', count: 5, enabled: true },
            { id: 'third', name: '三等奖', count: 10, enabled: true },
            { id: 'fourth', name: '四等奖', count: 20, enabled: false }
        ];
        const saved = localStorage.getItem('prizeConfig');
        return saved ? JSON.parse(saved) : defaultPrizes;
    },

    /**
     * 保存中奖记录到 localStorage
     */
    saveWinners(winners) {
        localStorage.setItem('winners', JSON.stringify(winners));
    },

    /**
     * 获取中奖记录
     */
    getWinners() {
        const saved = localStorage.getItem('winners');
        return saved ? JSON.parse(saved) : {};
    }
};
