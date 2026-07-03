const express = require('express');
const { Client } = require('pg');
const nodemailer = require('nodemailer');
const cors = require('cors');
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
const app = express();
app.use(cors());
app.use(express.json());
const db = new Client({
    host: 'localhost',
    user: 'postgres',
    password: '10051994',
    database: 'zehin',
    port: 5432
});
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nastya6160892@gmail.com',
        pass: 'liyv kujv evbv bzmo'
    }
});

const OWNER_EMAIL = 'nastya6160892@gmail.com';
db.connect(err => {
    if (err) {
        console.error('Ошибка подключения к PostgreSQL:', err.stack);
    } else {
        console.log('Успешно подключено к базе данных PostgreSQL');
    }
});

app.post('/api/feedback', async (req, res) => {
    const { name, phone, email, sms } = req.body;
    if (!name || !phone || !email || !sms) {
        return res.status(400).json({ error: 'Все поля должны быть заполнены!' });
    }
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ error: 'Неверный формат Email адреса!' });
    }
    const sqlQuery = `
        INSERT INTO feedback (customer_name, customer_phone, customer_email, sms) 
        VALUES ($1, $2, $3, $4)
    `;
    
    db.query(sqlQuery, [name, phone, email, sms], (err, result) => {
        if (err) {
            console.error('Ошибка PostgreSQL:', err);
            return res.status(500).json({ error: 'Не удалось сохранить в базу данных' });
        }
        const mailOptions = {
            from: '"Сайт Zehin Ýoly" <nastya6160892@gmail.com>', 
            to: OWNER_EMAIL,
            replyTo: email,
            subject: `📩 Новая заявка от ${name} с сайта Zehin Ýoly!`, 
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f2c94c; border-radius: 10px;">
                    <h2 style="color: #333;">Новое сообщение от пользователя!</h2>
                    <p><b>👤 Имя:</b> ${name}</p>
                    <p><b>📞 Телефон:</b> ${phone}</p>
                    <p><b>📧 Email пользователя:</b> <a href="mailto:${email}">${email}</a></p>
                    <p><b>💬 Сообщение:</b></p>
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #f2c94c; font-style: italic;">
                        ${sms}
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (mailErr, info) => {
            if (mailErr) {
                console.error('Ошибка отправки письма:', mailErr);
                return res.status(200).json({ success: true, warning: 'Данные в БД, но письмо не ушло.' });
            }
            
            console.log('Уведомление успешно отправлено на почту владельца!');
            res.status(200).json({ success: true });
        });
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
