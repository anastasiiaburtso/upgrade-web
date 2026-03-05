import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// Налаштування для ES-модулів
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ТВІЙ КОНФІГ FIREBASE (з 4 лабки)
const firebaseConfig = {
  apiKey: "AIzaSyCQEMphPeHiDlH4Jhe3oo8SRzETCKvm0vM",
  authDomain: "upgrade-app-6bc0c.firebaseapp.com",
  projectId: "upgrade-app-6bc0c",
  storageBucket: "upgrade-app-6bc0c.firebasestorage.app",
  messagingSenderId: "662753054158",
  appId: "1:662753054158:web:d044d3d17baed356012f9f"
};

// Ініціалізуємо Firebase прямо на сервері
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

app.use(express.static(path.join(__dirname, 'dist')));

// ==========================================
// API МАРШРУТИ (ВИМОГИ ЛАБ 5, ВАРІАНТ 3)
// ==========================================

// 1. HTTP GET: Отримання відгуків з трансформацією (dateFormatted + сортування)
app.get('/api/reviews/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const q = query(collection(db, "reviews"), where("courseId", "==", courseId));
        const snapshot = await getDocs(q);
        
        let reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() });
        });

        // ТРАНСФОРМАЦІЯ ДАНИХ (Вимога методички)
        reviews = reviews.map(review => {
            // Беремо час створення або поточний, якщо це старий відгук з 4 лабки
            const dateObj = new Date(review.timestamp || Date.now());
            
            // Форматуємо дату як "день.місяць.рік"
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            
            return {
                ...review,
                dateFormatted: `${day}.${month}.${year}`
            };
        });

        // Сортуємо від найновіших до найстаріших (Вимога методички)
        reviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        res.json(reviews);
    } catch (error) {
        console.error("Помилка GET /api/reviews:", error);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// 2. HTTP POST: Додавання нового відгуку
app.post('/api/reviews', async (req, res) => {
    try {
        const { courseId, email, text } = req.body;
        const reviewText = text ? text.trim() : "";
        
        // ВАЛІДАЦІЯ
        if (reviewText.length < 10 || reviewText.length > 500) {
            return res.status(400).json({ 
                error: "Текст відгуку має містити від 10 до 500 символів!" 
            });
        }
        
        // ДОДАВАННЯ ЧАСУ: у форматі ISO 8601 
        const newReview = { 
            courseId, 
            email, 
            text: reviewText, 
            createdAt: new Date().toISOString(), // Генерує дату типу "2026-03-05T20:31:00.000Z"
            timestamp: Date.now() // для зручного сортування
        };
        
        await addDoc(collection(db, "reviews"), newReview);
        
        res.status(201).json({ message: "Відгук успішно додано" });
    } catch (error) {
        console.error("Помилка POST /api/reviews:", error);
        res.status(500).json({ error: "Помилка при збереженні відгуку" });
    }
});

// Всі інші запити віддається React-у
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер успішно запущено на http://localhost:${PORT}`);
});