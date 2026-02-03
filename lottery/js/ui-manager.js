/**
 * UI 交互管理模块
 * 负责 DOM 操作、事件监听、弹窗展现以及侧边栏更新
 */
const UIManager = {
    currentPrize: null,
    prizeConfig: [],

    /**
     * 初始化 UI 逻辑
     */
    init() {
        this.prizeConfig = Storage.getPrizeConfig();
        this.updatePrizeUI();
        this.renderSettings();
        this.setupEventListeners();
    },

    /**
     * 绑定基础事件
     */
    setupEventListeners() {
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('folderInput').click();
        });

        document.getElementById('folderInput').addEventListener('change', async (e) => {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (files.length === 0) return;

            await Storage.clearPhotos();
            for (const file of files) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    await Storage.savePhoto(file.name, event.target.result);
                    if (file === files[files.length - 1]) {
                        const photos = await Storage.getAllPhotos();
                        LotteryCore.setParticipants(photos);
                        ThreeScene.createPhotoSphere(photos);
                    }
                };
                reader.readAsDataURL(file);
            }
            alert(`已导入 ${files.length} 张照片`);
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').style.display = 'flex';
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
            document.getElementById('settingsModal').style.display = 'none';
            this.updatePrizeUI();
        });

        document.getElementById('startBtn').addEventListener('click', () => this.toggleLottery());

        document.getElementById('closeResultsBtn').addEventListener('click', () => {
            document.getElementById('resultsModal').style.display = 'none';
        });

        document.getElementById('imageModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('imageModal') || e.target.classList.contains('close-btn')) {
                document.getElementById('imageModal').style.display = 'none';
            }
        });

        document.getElementById('resetDataBtn').addEventListener('click', () => {
            if (confirm('确定要清空所有照片和抽奖记录吗？此操作不可逆！')) {
                this.resetAll();
            }
        });
    },

    /**
     * 执行全局重置
     */
    async resetAll() {
        await Storage.clearPhotos();
        LotteryCore.reset();
        location.reload();
    },

    /**
     * 更新当前处于活动状态的奖项 UI 显示
     */
    updatePrizeUI() {
        const activePrizes = this.prizeConfig.filter(p => p.enabled);
        if (activePrizes.length > 0) {
            const unDrawn = activePrizes.find(p => {
                const drawnCount = LotteryCore.winners[p.id] ? LotteryCore.winners[p.id].length : 0;
                return drawnCount < p.count;
            });
            this.currentPrize = unDrawn || activePrizes[0];

            document.getElementById('prizeName').textContent = this.currentPrize.name;
            document.getElementById('prizeCount').textContent = this.currentPrize.count;
        }
        this.renderSidebar();
    },

    /**
     * 渲染左侧奖项进度列表
     */
    renderSidebar() {
        const list = document.getElementById('sidebarPrizeList');
        list.innerHTML = '';
        const activePrizes = this.prizeConfig.filter(p => p.enabled);

        activePrizes.forEach(prize => {
            const winnersCount = LotteryCore.winners[prize.id] ? LotteryCore.winners[prize.id].length : 0;
            const isDone = winnersCount >= prize.count;
            const isActive = this.currentPrize && this.currentPrize.id === prize.id;

            const li = document.createElement('li');
            if (isActive) li.className = 'active';
            if (isDone) li.classList.add('done');

            li.innerHTML = `
                <div class="prize-name-labels">${prize.name}</div>
                <div class="progress-container">
                    <span class="status-text">${winnersCount} / ${prize.count}</span>
                </div>
            `;
            list.appendChild(li);
        });
    },

    /**
     * 渲染设置面板中的奖项列表（支持拖拽排序）
     */
    renderSettings() {
        const tbody = document.getElementById('prizeList');
        tbody.innerHTML = '';
        this.prizeConfig.forEach((prize, index) => {
            const tr = document.createElement('tr');
            tr.draggable = true;
            tr.dataset.index = index;
            tr.innerHTML = `
                <td><input type="checkbox" ${prize.enabled ? 'checked' : ''} class="prize-enable"></td>
                <td><input type="text" value="${prize.name}" class="prize-name" readonly></td>
                <td><input type="number" value="${prize.count}" class="prize-count" min="1"></td>
            `;

            tr.addEventListener('dragstart', (e) => {
                tr.classList.add('dragging');
                e.dataTransfer.setData('text/plain', index);
            });

            tr.addEventListener('dragend', () => tr.classList.remove('dragging'));

            tr.addEventListener('dragover', (e) => {
                e.preventDefault();
                tr.classList.add('drag-over');
            });

            tr.addEventListener('dragleave', () => tr.classList.remove('drag-over'));

            tr.addEventListener('drop', (e) => {
                e.preventDefault();
                tr.classList.remove('drag-over');
                const fromIndex = e.dataTransfer.getData('text/plain');
                if (fromIndex !== index) {
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    const fromRow = rows.find(r => r.classList.contains('dragging'));
                    if (rows.indexOf(fromRow) < rows.indexOf(tr)) {
                        tr.after(fromRow);
                    } else {
                        tr.before(fromRow);
                    }
                }
            });

            tbody.appendChild(tr);
        });
    },

    /**
     * 从 DOM 表格读取最新顺序并保存配置
     */
    saveSettings() {
        const rows = document.querySelectorAll('#prizeList tr');
        this.prizeConfig = Array.from(rows).map(tr => ({
            id: tr.querySelector('.prize-name').value,
            name: tr.querySelector('.prize-name').value,
            enabled: tr.querySelector('.prize-enable').checked,
            count: parseInt(tr.querySelector('.prize-count').value) || 1
        }));
        Storage.savePrizeConfig(this.prizeConfig);
    },

    isDrawing: false,
    /**
     * 切换抽奖状态 (开始/停止)
     */
    toggleLottery() {
        const btn = document.getElementById('startBtn');
        if (!this.isDrawing) {
            if (!this.currentPrize) {
                alert('请先在设置中启用奖项');
                return;
            }
            if (LotteryCore.participants.length === 0) {
                alert('请先导入照片');
                return;
            }

            const currentDrawn = LotteryCore.winners[this.currentPrize.id] ? LotteryCore.winners[this.currentPrize.id].length : 0;
            if (currentDrawn >= this.currentPrize.count) {
                alert('该奖项已抽完，请在设置中增加名额或切换奖项');
                return;
            }

            this.isDrawing = true;
            btn.textContent = '停止抽奖';
            btn.classList.add('drawing');
            ThreeScene.setSpeed(0.2);
        } else {
            this.isDrawing = false;
            btn.textContent = '开始抽奖';
            btn.classList.remove('drawing');
            ThreeScene.setSpeed(0.005);

            const winner = LotteryCore.drawOne(this.currentPrize.id, this.currentPrize.count);
            if (winner) {
                this.showResults([winner]);
                this.updatePrizeUI();
            }
        }
    },

    /**
     * 显示中奖结果弹窗
     * @param {Array} winners - 中奖者列表(目前仅一个)
     */
    showResults(winners) {
        const grid = document.getElementById('winnerGrid');
        grid.innerHTML = '';
        document.getElementById('winnerTitle').textContent = `恭喜中奖：${this.currentPrize.name}`;

        winners.forEach(winnerName => {
            const winner = LotteryCore.participants.find(p => p.name === winnerName || (typeof winnerName === 'object' && p.name === winnerName.name));
            const dataUrl = winner ? winner.data : '';

            const card = document.createElement('div');
            card.className = 'winner-card';
            card.innerHTML = `<img src="${dataUrl}" alt="winner">`;
            card.addEventListener('click', () => {
                document.getElementById('fullImage').src = dataUrl;
                document.getElementById('imageModal').style.display = 'flex';
            });
            grid.appendChild(card);
        });

        document.getElementById('resultsModal').style.display = 'flex';
    }
};
