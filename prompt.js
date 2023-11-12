const jsonfile = require('edit-json-file');
const { validate } = require('promptparse');
const jsQR = require('jsqr');
const Jimp = require('jimp');
const axios = require('axios');
module.exports = {
    name: "prompt",
    description: "เช็คสลิป",
    options: [

        {
            name: 'image',
            description: 'image qr',
            type: 11,
            required: true
        },


    ],
    run: async (client, interaction) => {

        let image = interaction.options.getAttachment('image'); // ดึงค่า image ที่เราเลือกมาใช้ base64

        const ima = await Jimp.read(image.url); // อ่านรูปภาพ base64 
        const { data, width, height } = ima.resize(1080, 1858).bitmap; // ปรับขนาดรูปภาพ base64 ให้เป็น 1080x1858
        const code = jsQR(data, width, height); // แปลง QR Code ให้เป็นข้อความ : string and number



        const ppqr = validate.slipVerify(code.data) // ตรวจสอบ QR Code ว่าถูกต้องหรือไม่ โดยใช้ function จาก promptparse
        if(!ppqr) return interaction.reply('ไม่พบข้อมูลใน QR Code นี้') // ถ้าไม่ถูกต้องให้ส่งข้อความว่า ไม่พบข้อมูลใน QR Code นี้ 

        let api = 'https://suba.rdcw.co.th/v1/inquiry' // ลิงค์ api ของ https://slip.rdcw.co.th/docs

        /**
         * curl -u 'CLIENT_ID:CLIENT_SECRET' \
         *  -H 'Content-Type: application/json' \
         * -d '{"payload":"PAYLOAD"}' \
         * https://suba.rdcw.co.th/v1/inquiry
         */

        const res = await axios.post(api, { // ส่งข้อมูลไปที่ api
            payload: code.data // ข้อมูลที่จะส่งไป
        }, {
            auth: { // ส่วนของการยืนยันตัวตน
                username: '', // ชื่อผู้ใช้
                password: '' // รหัสผ่าน
            }
        })

        console.log(res.data); // แสดงข้อมูลที่ได้จาก api
        if (res.data.quota.usage >= res.data.quota.limit) return interaction.reply('คุณใช้สิทธิ์การตรวจสอบครบแล้ว') // ถ้าใช้สิทธิ์การตรวจสอบครบแล้วให้ส่งข้อความว่า คุณใช้สิทธิ์การตรวจสอบครบแล้ว

        if (res.data.isCached == true) { // ถ้าสลิปนี้ได้ตรวจสอบไปแล้ว
            return interaction.reply('สลิปนี้ได้ตรวจสอบไปแล้ว') // ส่งข้อความว่า สลิปนี้ได้ตรวจสอบไปแล้ว
        }

        if(res.data.isCached == false) { // ถ้าสลิปนี้ยังไม่ได้ตรวจสอบ
            if(res.data.valid == true) { // ถ้าสลิปนี้ถูกต้อง
                const file = jsonfile(`${__dirname}/../../data/prompt.json`); // ตัวแปรที่เก็บไฟล์ json ไว้
                const data = file.toObject(); // แปลงข้อมูลในไฟล์ json ให้เป็น Object
                const user = interaction.user.id; // ตัวแปรที่เก็บไอดีผู้ใช้
                if(data[user]) return interaction.reply('คุณได้ลงทะเบียนไปแล้ว'); // ถ้าไอดีผู้ใช้นี้ลงทะเบียนไปแล้วให้ส่งข้อความว่า คุณได้ลงทะเบียนไปแล้ว
                file.set(user, { // ตั้งค่าข้อมูลให้เป็นข้อมูลที่เราต้องการ
                    id: user,
                    name: interaction.user.username,
                    code: code.data,
                    amount: res.data.data.amount,
                    date: new Date().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'})
                })
                file.save(); // บันทึกไฟล์
                await interaction.reply({ content: 'ลงทะเบียนสำเร็จ', ephemeral: true }) // ส่งข้อความว่า ลงทะเบียนสำเร็จ
            }
        }

        
        
        
    }

}
