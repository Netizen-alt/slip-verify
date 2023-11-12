const jsonfile = require('edit-json-file');
const Embeds = require('../../functions/embed');
const { PermissionFlagsBits, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const config = require('../../config/config');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { v4: uuidv4 } = require('uuid');
const {validate} = require('promptparse');
const jsQR = require('jsqr');
const Jimp = require('jimp');
const axios = require('axios');
module.exports = {
    name: "prompt",
    description: "ลงทะเบียนระบบป้องกันการแบน",
    options: [

        {
            name: 'image',
            description: 'image qr',
            type: 11,
            required: true
        },


    ],
    run: async (client, interaction) => {

        let image = interaction.options.getAttachment('image');

        const ima = await Jimp.read(image.url);
        const { data, width, height } = ima.resize(1080, 1858).bitmap;
        const code = jsQR(data, width, height);



        const ppqr = validate.slipVerify(code.data)
        if(!ppqr) return interaction.reply('ไม่พบข้อมูลใน QR Code นี้')

        let api = 'https://suba.rdcw.co.th/v1/inquiry'


        const res = await axios.post(api, {
            payload: code.data
        }, {
            auth: {
                username: '',
                password: 'zIpTq--VjlR86'
            }
        })

        console.log(res.data);
        if (res.data.quota.usage >= res.data.quota.limit) return interaction.reply('คุณใช้สิทธิ์การตรวจสอบครบแล้ว')

        if (res.data.isCached == true) {
            return interaction.reply('สลิปนี้ได้ตรวจสอบไปแล้ว')
        }

        if(res.data.isCached == false) {
            if(res.data.valid == true) {
                const file = jsonfile(`${__dirname}/../../data/prompt.json`);
                const data = file.toObject();
                const user = interaction.user.id;
                if(data[user]) return interaction.reply('คุณได้ลงทะเบียนไปแล้ว');
                file.set(user, {
                    id: user,
                    name: interaction.user.username,
                    code: code.data,
                    amount: res.data.data.amount,
                    date: new Date().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'})
                })
                file.save();
                await interaction.reply({ content: 'ลงทะเบียนสำเร็จ', ephemeral: true })
            }
        }

        
        
        
    }

}