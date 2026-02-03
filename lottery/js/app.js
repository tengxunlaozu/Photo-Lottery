/**
 * 应用主入口文件
 */
async function initApp() {
    console.log('正在初始化抽奖程序...');

    await Storage.init();

    UIManager.init();

    ThreeScene.init('container');

    const photos = await Storage.getAllPhotos();
    LotteryCore.setParticipants(photos);
    LotteryCore.winners = Storage.getWinners();

    if (photos.length > 0) {
        ThreeScene.createPhotoSphere(photos);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
