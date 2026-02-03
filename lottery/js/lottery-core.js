/**
 * 抽奖核心逻辑模块
 */
const LotteryCore = {
    participants: [],
    winners: {},

    /**
     * 设置参与者列表
     * @param {Array} photos - 照片对象数组
     */
    setParticipants(photos) {
        this.participants = photos;
    },

    /**
     * 获取当前还未中奖的参与者列表
     * @returns {Array} 剩余参与者
     */
    getAvailableParticipants() {
        const wonNames = Object.values(this.winners).flat();
        return this.participants.filter(p => !wonNames.includes(p.name));
    },

    /**
     * 执行单次抽奖
     * @param {string} prizeId - 奖项唯一标识
     * @param {number} totalLimit - 该奖项的总名额
     * @returns {Object|null} 中奖的照片对象
     */
    drawOne(prizeId, totalLimit) {
        const currentPrizeWinners = this.winners[prizeId] || [];
        if (currentPrizeWinners.length >= totalLimit) {
            alert('该奖项名额已抽满！');
            return null;
        }

        const available = this.getAvailableParticipants();
        if (available.length === 0) {
            alert('所有参与者都已中奖，池中已无照片！');
            return null;
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        const winner = available[randomIndex];

        if (!this.winners[prizeId]) {
            this.winners[prizeId] = [];
        }

        this.winners[prizeId].push(winner.name);
        Storage.saveWinners(this.winners);

        return winner;
    },

    /**
     * 重置所有中奖记录
     */
    reset() {
        this.winners = {};
        Storage.saveWinners(this.winners);
    }
};
