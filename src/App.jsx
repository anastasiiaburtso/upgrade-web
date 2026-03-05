import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';

// Імпорти Firebase
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, doc, setDoc, query, where } from 'firebase/firestore';

// Імпортуємо старі дані лише для ОДНОРАЗОВОГО завантаження в Firebase
import { coursesData, initialSchedule } from './data';


// Форма Авторизації / Реєстрації
const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Успішний вхід!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Успішна реєстрація!");
      }
      navigate('/');
    } catch (error) {
      alert("Помилка: " + error.message);
    }
  };

  return (
    <section className="section-container" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <div className="card">
        <h2>{isLogin ? 'Вхід' : 'Реєстрація'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '8px' }} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '8px' }} />
          <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '15px', background: 'none', border: 'none', color: 'var(--neon-pink)', cursor: 'pointer', textDecoration: 'underline' }}>
          {isLogin ? 'Немає акаунту? Реєстрація' : 'Вже є акаунт? Вхід'}
        </button>
      </div>
    </section>
  );
};


// Деталі курсу та Відгуки
const CourseDetails = ({ user }) => {
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');

  // 1. Отримуємо відгуки через наше API (HTTP GET)
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews/${id}`);
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error("Помилка завантаження відгуків:", error);
      }
    };
    fetchReviews();
  }, [id]);

  // 2. Зберігаємо відгук через наше API (HTTP POST)
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.trim()) return;
    
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: id, email: user.email, text: newReview })
      });

      // Оновлюємо список (завантажуємо заново, щоб отримати відформатовану дату із сервера)
      const response = await fetch(`/api/reviews/${id}`);
      const data = await response.json();
      setReviews(data);
      setNewReview('');
    } catch (error) {
      console.error("Помилка додавання відгуку:", error);
    }
  };

  if (!user) return <div className="section-container"><h2 style={{color: 'red', textAlign: 'center'}}>Доступ заборонено. Увійдіть у систему!</h2></div>;

  return (
    <section className="section-container">
      <div className="card">
        <h2>Деталі курсу та Відгуки</h2>
        <p>Ви переглядаєте закриту інформацію для курсу з ID: <strong>{id}</strong></p>
        
        <h3 style={{ marginTop: '30px', color: 'var(--neon-pink)' }}>Відгуки студентів:</h3>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '15px' }}>
          {reviews.length === 0 ? <li style={{color: 'gray'}}>Відгуків ще немає. Будьте першим!</li> : 
            reviews.map((r, i) => (
              <li key={i} style={{ borderBottom: '1px solid gray', padding: '10px 0' }}>
                {/* Виводимо поле dateFormatted, яке згенерував наш сервер! */}
                <strong>{r.email}</strong>: {r.text} <span style={{fontSize: '0.8rem', color: 'var(--neon-pink)'}}>({r.dateFormatted})</span>
              </li>
            ))
          }
        </ul>

        <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <textarea value={newReview} onChange={e => setNewReview(e.target.value)} placeholder="Напишіть свій відгук..." rows="4" style={{ padding: '10px', borderRadius: '8px', outline: 'none' }} required></textarea>
          <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Залишити відгук</button>
        </form>
      </div>
    </section>
  );
};


// Картка курсу
const CourseCard = ({ course, onStart, onComplete, isStarted, isCompleted, user }) => {
  const navigate = useNavigate();
  let cardStyle = {};
  if (isCompleted) cardStyle = { backgroundColor: 'rgba(53, 17, 64, 0.51)', borderColor: 'var(--neon-pink)' };
  else if (isStarted) cardStyle = { borderColor: 'var(--neon-pink)' };

  const handleDetailsClick = () => {
    if (user) {
      navigate(`/course/${course.id}`);
    } else {
      alert("Лише авторизовані користувачі можуть переглядати деталі та залишати відгуки!");
    }
  };

  return (
    <div className={`card ${isCompleted ? 'is-completed' : ''}`} style={cardStyle}>
      <div className={`card-badge ${course.category === 'Середній' ? 'badge-medium' : ''}`}>{course.category}</div>
      <h3>{course.title}</h3>
      <p className="instructor">👨‍🏫 Викладач: {course.instructor}</p>
      <p>Тривалість: <span className="duration">{course.duration}</span> місяців</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexDirection: 'column' }}>
        <button onClick={handleDetailsClick} style={{ padding: '8px', background: 'transparent', color: 'var(--text-main)', border: '1px dashed var(--neon-pink)', borderRadius: '6px', cursor: 'pointer' }}>
          Деталі та Відгуки
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isCompleted ? (
            <div style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', width: '100%' }}>Пройдено</div>
          ) : (
            <>
              <button onClick={() => onStart(course)} disabled={isStarted} style={{ padding: '8px', backgroundColor: isStarted ? 'var(--neon-pink)' : 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: isStarted ? 'default' : 'pointer', flex: 1 }}>
                {isStarted ? 'Вивчається...' : 'Розпочати'}
              </button>
              <button onClick={() => onComplete(course)} disabled={!isStarted} style={{ padding: '8px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--text-muted)', borderRadius: '6px', cursor: !isStarted ? 'not-allowed' : 'pointer', flex: 1 }}>
                Завершити
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Блок прогресу 
const ProgressBlock = ({ startedCourses, completedCourses, totalCourses }) => {
  const percentage = Math.round((completedCourses.length / totalCourses) * 100) || 0;
  const trackedCourses = [...new Set([...startedCourses, ...completedCourses])];

  return (
    <div className="card cabinet-card" id="progress-card">
      <h3>📈 Поточний прогрес</h3>
      
      <div className="progress-item" style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px dashed var(--text-muted)' }}>
        <p><strong>Загальний прогрес</strong> <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold' }}>{percentage}%</span></p>
        <div className="progress-bar" style={{ height: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          <div className="fill" style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--neon-pink), var(--primary-color))', borderRadius: '6px', transition: 'width 0.8s ease' }}></div>
        </div>
      </div>
      
      {trackedCourses.map(course => {
         const isDone = completedCourses.some(c => c.id === course.id);
         return (
           <div key={course.id} className="progress-item">
              <p>{course.title} <span style={{ color: isDone ? 'var(--neon-pink)' : 'var(--text-main)' }}>{isDone ? '100%' : '0%'}</span></p>
              <div className="progress-bar">
                  <div className="fill" style={{ width: isDone ? '100%' : '0%', background: isDone ? 'var(--neon-pink)' : 'linear-gradient(90deg, #6C2BD9, #FF2E9F)', transition: 'width 0.8s ease' }}></div>
              </div>
           </div>
         );
      })}
    </div>
  );
};

// ГОЛОВНИЙ КОМПОНЕНТ APP
function App() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  
  // Для кабінету (локальний стейт прогресу)
  const [started, setStarted] = useState([]);
  const [completed, setCompleted] = useState([]);

  // Відстеження стану авторизації
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Отримання даних з Firebase Firestore
  const fetchDataFromDB = async () => {
    try {
      const coursesSnap = await getDocs(collection(db, "courses"));
      setCourses(coursesSnap.docs.map(doc => doc.data()));

      const scheduleSnap = await getDocs(collection(db, "schedule"));
      setSchedule(scheduleSnap.docs.map(doc => doc.data()));
    } catch (error) {
      console.log("База даних пуста або помилка доступу", error);
    }
  };

  useEffect(() => {
    fetchDataFromDB();
  }, []);

  // ТИМЧАСОВА КНОПКА: для завантаження даних у пусту Firebase-базу
  const initializeDatabase = async () => {
    for (let c of coursesData) await setDoc(doc(db, "courses", c.id.toString()), c);
    for (let s of initialSchedule) await setDoc(doc(db, "schedule", s.id.toString()), s);
    alert("Базу даних заповнено! Оновіть сторінку.");
    fetchDataFromDB();
  };

  return (
    <>
      <header className="main-header">
        <div className="logo">Up<span>Grade</span></div>
        <nav>
          <ul>
            <li>
              <Link 
                to="/" 
                onClick={() => {
                  setTimeout(() => {
                    document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Курси
              </Link>
            </li>
            <li><Link to="/schedule">Розклад</Link></li>
            <li><Link to="/cabinet">Кабінет</Link></li>
            {user ? (
              <>
                <li><span style={{ color: 'var(--neon-pink)' }}>{user.email}</span></li>
                <li><button onClick={() => signOut(auth)} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Вийти</button></li>
              </>
            ) : (
              <li><Link to="/auth" style={{ color: 'var(--neon-pink)', fontWeight: 'bold' }}>Увійти</Link></li>
            )}
          </ul>
        </nav>
      </header>

      <main>
        {/* Кнопка ініціалізації БД (видно лише якщо курсів у базі ще немає) */}
        {courses.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={initializeDatabase} style={{ padding: '15px', background: 'var(--neon-pink)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              ⚠️ Натисніть сюди, щоб заповнити Firestore базу даних початковими даними!
            </button>
          </div>
        )}

        <Routes>
          {/* ГОЛОВНА: БАНЕР + КУРСИ */}
          <Route path="/" element={
            <>
              {/* HERO */}
              <section className="hero" id="hero-section">
                <div className="hero-content">
                  <h1>Кодуй, проєктуй, запускай — <br/>разом з UpGrade</h1>
                  <p>
                    UpGrade — це інноваційний провідник у світ сучасних технологій. 
                    Від першого рядка коду до власного робочого продукту. 
                    Здобувай затребувану ІТ-професію у зручному темпі: працюй над реальними завданнями, 
                    отримуй фідбек від експертів та ставай спеціалістом, якого шукають топові компанії.
                  </p>
                </div>
                <img src="/hero.png" alt="Online learning platform" className="hero-image" />
              </section>

              {/* COURSES (КУРСИ) */}
              <article className="section-container" id="courses-section">
                <h2 className="section-title">Доступні курси</h2>
                <div className="grid-container courses-grid">
                  {courses.map(course => (
                    <CourseCard 
                      key={course.id} course={course} user={user}
                      isStarted={started.some(c => c.id === course.id)}
                      isCompleted={completed.some(c => c.id === course.id)}
                      onStart={(c) => setStarted([c, ...started])}
                      onComplete={(c) => setCompleted([...completed, c])}
                    />
                  ))}
                </div>
              </article>
            </>
          } />

          <Route path="/auth" element={<AuthPage />} />
          <Route path="/course/:id" element={<CourseDetails user={user} />} />
          
          <Route path="/schedule" element={
            <section className="section-container bg-light">
              <h2 className="section-title">Розклад занять з Firestore</h2>
              <div className="schedule-wrapper">
                <ul className="schedule-list">
                  {schedule.map(item => (
                    <li key={item.id}><span className="time">{item.time}</span><span className="course-name">{item.courseName}</span></li>
                  ))}
                </ul>
              </div>
            </section>
          } />

          <Route path="/cabinet" element={
            <section className="section-container" id="cabinet">
              <h2 className="section-title">Мій кабінет</h2>
              
              {!user && (
                <div style={{ textAlign: 'center', color: 'var(--neon-pink)', marginBottom: '20px' }}>
                  ⚠️ Увійдіть у систему, щоб ваш прогрес зберігався надійно!
                </div>
              )}

              <div className="grid-container cabinet-grid">
                
                <div className="card cabinet-card" id="completed-courses-card">
                  <h3>📚 Пройдені курси</h3>
                  <ul>
                    {completed.length === 0 ? (
                      <li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Ви ще не завершили жодного курсу.</li>
                    ) : (
                      completed.map(c => <li key={c.id} style={{color: 'var(--text-main)'}}>🎓 {c.title}</li>)
                    )}
                  </ul>
                </div>

                <ProgressBlock startedCourses={started} completedCourses={completed} totalCourses={courses.length || 6} />

                <div className="card cabinet-card">
                  <h3>🏆 Сертифікати</h3>
                  <ul><li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Сертифікати відсутні.</li></ul>
                </div>

              </div>
            </section>
          } />
        </Routes>
      </main>
    </>
  );
}

export default App;