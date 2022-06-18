var Jimp = require('jimp');

Jimp.read("https://files.liveworksheets.com/def_files/2020/5/25/525020452235838/525020452235838001.jpg", async (err, image) => {
    if (err) throw err;
    tt=image.greyscale().quality(100).posterize(4).write('lena-small-bw2.jpg');
    return
    console.log(await tt.getBufferAsync(Jimp.AUTO))
});