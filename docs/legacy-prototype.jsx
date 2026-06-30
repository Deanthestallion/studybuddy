import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    BookOpen, Calendar as CalendarIcon, Clock, CheckCircle2, Award,
    Sparkles, MessageSquare, Shield, User, Settings, Sun, Moon,
    Plus, Trash2, Check, Play, Square, RefreshCw, Volume2, VolumeX,
    Send, ChevronRight, BarChart2, BookOpenCheck, BrainCircuit, AlertCircle,
    FolderPlus, Search, Edit2, Zap, HelpCircle, Trophy, Users, Star, ArrowRight
} from 'lucide-react';

// --- STYLES & INTERPOLATIVE GRADIENTS ---
const CARD_BG = "backdrop-blur-md border shadow-sm transition-all duration-300";

// --- PRESETS & INITIAL STATS ---
const QUOTES = [
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Procrastination is the thief of time. Collar him.", author: "Charles Dickens" },
    { text: "Success is the sum of small efforts, repeated day-in and day-out.", author: "Robert Collier" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" }
];

const INITIAL_SUBJECTS = [
    { id: '1', name: 'Mathematics', color: '#3b82f6', goals: 5, completed: 3 },
    { id: '2', name: 'Biology', color: '#10b981', goals: 8, completed: 6 },
    { id: '3', name: 'Computer Science', color: '#8b5cf6', goals: 10, completed: 4 },
    { id: '4', name: 'World History', color: '#f59e0b', goals: 4, completed: 1 }
];

const INITIAL_TIMETABLE = [
    { day: 'Monday', slots: [{ time: '09:00 AM', subject: 'Mathematics', location: 'Room 302' }, { time: '01:00 PM', subject: 'Biology', location: 'Lab B' }] },
    { day: 'Tuesday', slots: [{ time: '10:30 AM', subject: 'Computer Science', location: 'Lab A' }, { time: '03:00 PM', subject: 'World History', location: 'Room 101' }] },
    { day: 'Wednesday', slots: [{ time: '09:00 AM', subject: 'Mathematics', location: 'Room 302' }, { time: '01:00 PM', subject: 'Biology', location: 'Lab B' }] },
    { day: 'Thursday', slots: [{ time: '11:00 AM', subject: 'Computer Science', location: 'Lab A' }, { time: '02:00 PM', subject: 'World History', location: 'Room 101' }] },
    { day: 'Friday', slots: [{ time: '10:00 AM', subject: 'Study Group Session', location: 'Library' }] }
];

const INITIAL_ASSIGNMENTS = [
    { id: '1', title: 'Calculus Assignment 4', subject: 'Mathematics', due: '2026-07-05', priority: 'High', completed: false },
    { id: '2', title: 'Biology Lab Report', subject: 'Biology', due: '2026-07-08', priority: 'Medium', completed: true },
    { id: '3', title: 'Algorithm Python Script', subject: 'Computer Science', due: '2026-07-02', priority: 'High', completed: false },
    { id: '4', title: 'French Revolution Essay', subject: 'World History', due: '2026-07-15', priority: 'Low', completed: false }
];

const INITIAL_NOTES = [
    { id: '1', title: 'Mitosis Lecture Notes', folder: 'Biology', content: 'Mitosis is a process of cell duplication, or reproduction, during which one cell gives rise to two genetically identical daughter cells.\n\nKey Stages:\n1. Prophase: Chromatin condenses into chromosomes\n2. Metaphase: Chromosomes line up along metaphase plate\n3. Anaphase: Sister chromatids separate\n4. Telophase: Nuclear membrane reforms', updated: '2026-06-28' },
    { id: '2', title: 'Calculus Derivatives Sheet', folder: 'Mathematics', content: 'Derivatives cheat-sheet:\n- d/dx(x^n) = n * x^(n-1)\n- d/dx(sin x) = cos x\n- d/dx(cos x) = -sin x\n- d/dx(e^x) = e^x\n- Product Rule: (uv)\' = u\'v + uv\'', updated: '2026-06-29' }
];

const INITIAL_FLASHCARDS = [
    {
        id: 'deck-1',
        title: 'Cellular Biology Basics',
        subject: 'Biology',
        cards: [
            { front: 'What is the powerhouse of the cell?', back: 'Mitochondria. It generates most of the chemical energy needed to power the cell\'s biochemical reactions.' },
            { front: 'What is transcription?', back: 'The process of making an RNA copy of a gene sequence from DNA.' },
            { front: 'What is the function of Ribosomes?', back: 'They serve as the site of biological protein synthesis (translation).' }
        ]
    },
    {
        id: 'deck-2',
        title: 'CS Data Structures',
        subject: 'Computer Science',
        cards: [
            { front: 'What is a Queue data structure?', back: 'A FIFO (First-In-First-Out) linear data structure where elements are inserted at the back and removed from the front.' },
            { front: 'What is the average lookup time complexity in a Hash Map?', back: 'O(1) amortized constant time complexity.' },
            { front: 'Difference between Stack and Queue?', back: 'Stack is LIFO (Last-In-First-Out), while Queue is FIFO (First-In-First-Out).' }
        ]
    }
];

const CHAT_ROOMS = [
    { id: 'calc-club', name: 'Calculus Club', subject: 'Mathematics', users: 14 },
    { id: 'bio-crew', name: 'Biology Crew', subject: 'Biology', users: 22 },
    { id: 'dev-force', name: 'Algorithm Dev Force', subject: 'Computer Science', users: 9 }
];

export default function App() {
    // --- LAYOUT & NAVIGATION ---
    const [currentPage, setCurrentPage] = useState('dashboard'); // landing, login, dashboard, planner, calendar, notes, flashcards, quiz, groups, admin, profile, settings
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    // --- USER AUTHENTICATION & GAMIFICATION ---
    const [userProfile, setUserProfile] = useState({
        name: 'Alex Rivera',
        email: 'alex.rivera@edu.com',
        institution: 'State University',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        xp: 2450,
        level: 12,
        streak: 6
    });

    // --- CORE DATA STATES ---
    const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
    const [timetable, setTimetable] = useState(INITIAL_TIMETABLE);
    const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
    const [notes, setNotes] = useState(INITIAL_NOTES);
    const [flashcardDecks, setFlashcardDecks] = useState(INITIAL_FLASHCARDS);
    const [selectedDeck, setSelectedDeck] = useState(null);
    const [selectedNotes, setSelectedNotes] = useState(null);

    // --- POMODORO TIMER CONFIGS & WEB AUDIO SYNTHESIS ---
    const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
    const [pomoActive, setPomoActive] = useState(false);
    const [pomoMode, setPomoMode] = useState('focus'); // focus (25m), shortBreak (5m), longBreak (15m)
    const [ambientSound, setAmbientSound] = useState('none'); // none, rain, ocean, forest
    const audioContextRef = useRef(null);
    const noiseSourceNode = useRef(null);
    const lfoNode = useRef(null);
    const noiseGainNode = useRef(null);

    // --- AI STUDY ASSISTANT (GEMINI INTEGRATION) ---
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiChatHistory, setAiChatHistory] = useState([
        { sender: 'assistant', text: 'Hi! I am your AI Study Buddy. Ask me to explain a complex topic, generate flashcards, or create a quick test for you! (e.g. "Create 3 flashcards about Photosynthesis")' }
    ]);
    const [aiUserInput, setAiUserInput] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);

    // --- AI FLASHCARD GENERATOR FORM STATE ---
    const [aiPromptFlashcard, setAiPromptFlashcard] = useState('');
    const [aiPromptQuiz, setAiPromptQuiz] = useState('');

    // --- QUIZ CENTER STATE ---
    const [quizRunning, setQuizRunning] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null);
    const [quizFinished, setQuizFinished] = useState(false);
    const [quizTimer, setQuizTimer] = useState(0);
    const quizIntervalRef = useRef(null);

    // --- STUDY GROUP SIMULATION ---
    const [activeGroupRoom, setActiveGroupRoom] = useState('calc-club');
    const [groupChats, setGroupChats] = useState({
        'calc-club': [
            { sender: 'Lily Rose', text: 'Has anyone solved Problem 3 in Calculus HW? That chain rule looks crazy!', time: '12:05 PM', isSelf: false },
            { sender: 'David Miller', text: 'Yeah, you need to substitute u = sin(x^2) first, then apply outer chain.', time: '12:12 PM', isSelf: false },
            { sender: 'Alex Rivera', text: 'Ah makes sense, thank you David! I will try that now.', time: '12:14 PM', isSelf: true }
        ],
        'bio-crew': [
            { sender: 'Elena Rostova', text: 'Reminder: Cell Division lab report is due Friday!', time: '09:00 AM', isSelf: false },
            { sender: 'Zack Peterson', text: 'Thanks. Does anyone want to peer-review in the library tomorrow?', time: '09:44 AM', isSelf: false }
        ],
        'dev-force': [
            { sender: 'Sanjay Kumar', text: 'Python list comprehensions are so elegant compared to standard loops.', time: 'Yesterday', isSelf: false }
        ]
    });
    const [newGroupMessage, setNewGroupMessage] = useState('');

    // --- ADD FORMS STATE ---
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [newSubjName, setNewSubjName] = useState('');
    const [newSubjColor, setNewSubjColor] = useState('#3b82f6');
    const [newSubjGoals, setNewSubjGoals] = useState(5);

    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskSubj, setNewTaskSubj] = useState('Mathematics');
    const [newTaskDue, setNewTaskDue] = useState('2026-07-01');
    const [newTaskPriority, setNewTaskPriority] = useState('Medium');

    // Daily quote selector
    const randomQuote = useMemo(() => {
        return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }, []);

    // Gamification triggers
    const addXP = (amount) => {
        setUserProfile(prev => {
            const newXp = prev.xp + amount;
            const targetXp = prev.level * 200;
            let newLvl = prev.level;
            if (newXp >= targetXp) {
                newLvl += 1;
                triggerNotification('Level Up!', `Congratulations! You reached Level ${newLvl}! 🎉`);
            }
            return { ...prev, xp: newXp, level: newLvl };
        });
    };

    // Toast System / Custom notification trigger (no alerts allowed)
    const [notifications, setNotifications] = useState([]);
    const triggerNotification = (title, msg) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, msg }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // --- SOUND EFFECTS SYNTHESIZER ---
    const playSynthesizedTone = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'task') {
                osc.frequency.setValueAtTime(392, ctx.currentTime); // G4
                osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.1); // C5
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            console.warn("Sound play failed", e);
        }
    };

    // --- AMBIENT SOUND GENERATOR (WEB AUDIO INTERFACES) ---
    const stopAmbientSound = () => {
        if (lfoNode.current) { lfoNode.current.stop(); lfoNode.current = null; }
        if (noiseSourceNode.current) { noiseSourceNode.current.stop(); noiseSourceNode.current = null; }
        if (noiseGainNode.current) { noiseGainNode.current.disconnect(); noiseGainNode.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    };

    const startAmbientSound = (type) => {
        stopAmbientSound();
        if (type === 'none') return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            const ctx = audioContextRef.current;

            // Create White Noise buffer
            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;

            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            if (type === 'rain') {
                // Low/mid filter for heavy water drop sound
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
            } else if (type === 'ocean') {
                // High filter modulated by LFO to simulate wave periods
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(600, ctx.currentTime);
                filter.Q.setValueAtTime(1.0, ctx.currentTime);

                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Wave every ~8 seconds

                const lfoGain = ctx.createGain();
                lfoGain.gain.setValueAtTime(400, ctx.currentTime); // sweep range

                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                lfo.start();
                lfoNode.current = lfo;
            } else if (type === 'forest') {
                // Gentle whistling wind
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1100, ctx.currentTime);
                filter.Q.setValueAtTime(3.0, ctx.currentTime);

                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.setValueAtTime(0.3, ctx.currentTime);

                const lfoGain = ctx.createGain();
                lfoGain.gain.setValueAtTime(250, ctx.currentTime);

                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                lfo.start();
                lfoNode.current = lfo;
            }

            noise.start();
            noiseSourceNode.current = noise;
            noiseGainNode.current = gain;
        } catch (err) {
            console.error("Web Audio synthesis is blocked or unsupported: ", err);
        }
    };

    useEffect(() => {
        startAmbientSound(ambientSound);
        return () => stopAmbientSound();
    }, [ambientSound]);

    // --- POMODORO TIMER HOOKS ---
    useEffect(() => {
        let interval = null;
        if (pomoActive) {
            interval = setInterval(() => {
                setPomoTimeLeft(prev => {
                    if (prev <= 1) {
                        setPomoActive(false);
                        playSynthesizedTone('success');
                        // Completed!
                        const addedXp = pomoMode === 'focus' ? 150 : 50;
                        addXP(addedXp);
                        triggerNotification('Session Complete!', `Great job! You gained ${addedXp} XP for completing your ${pomoMode} timer.`);

                        // Auto switch modes
                        if (pomoMode === 'focus') {
                            setPomoMode('shortBreak');
                            return 5 * 60;
                        } else {
                            setPomoMode('focus');
                            return 25 * 60;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [pomoActive, pomoMode]);

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- EXPONENTIAL BACKOFF CALLS FOR GEMINI ---
    const callGeminiWithBackoff = async (payload, systemInstruction = "", retries = 5, delay = 1000) => {
        const key = aiApiKey || ""; // Runtime injected or input
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`;

        const body = {
            contents: [{ parts: [{ text: payload }] }]
        };
        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (response.ok) {
                    const data = await response.json();
                    return data;
                }
                if (response.status === 429) {
                    // rate limit, sleep and retry
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2;
                    continue;
                }
                throw new Error(`API error code ${response.status}`);
            } catch (err) {
                if (i === retries - 1) throw err;
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }
    };

    // AI Quiz Builder Handler
    const generateAIQuiz = async () => {
        if (!aiPromptQuiz.trim()) return;
        setAiGenerating(true);
        const query = `Create a strict JSON-formatted multiple choice quiz about: "${aiPromptQuiz}". It must have exactly 5 questions. Do not write any markdown outside the JSON block. Return ONLY a JSON object string fitting this schema:
    {
      "questions": [
        {
          "question": "What is...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Why this answer is right"
        }
      ]
    }`;

        try {
            const response = await callGeminiWithBackoff(query, "You are an educational quiz generation system. You output valid parsable raw JSON blocks.");
            const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;

            // Attempt clean extraction of JSON block
            const cleanJsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
            const parsedData = JSON.parse(cleanJsonStr);

            if (parsedData.questions && parsedData.questions.length > 0) {
                setQuizQuestions(parsedData.questions);
                setQuizScore(0);
                setCurrentQuizIdx(0);
                setSelectedQuizAnswer(null);
                setQuizFinished(false);
                setQuizRunning(true);
                setQuizTimer(0);

                // Start Timer
                if (quizIntervalRef.current) clearInterval(quizIntervalRef.current);
                quizIntervalRef.current = setInterval(() => {
                    setQuizTimer(prev => prev + 1);
                }, 1000);

                triggerNotification('Quiz Generated!', `AI successfully constructed a 5-question test on "${aiPromptQuiz}".`);
                setCurrentPage('quiz');
            } else {
                throw new Error("Empty array of quiz questions");
            }
        } catch (err) {
            console.error(err);
            triggerNotification('AI Generation Failed', 'Ensure API Key is correct and try a simpler prompt.');
        } finally {
            setAiGenerating(false);
        }
    };

    // AI Flashcards Creator
    const generateAIFlashcards = async () => {
        if (!aiPromptFlashcard.trim()) return;
        setAiGenerating(true);
        const query = `Create a strict JSON-formatted flashcard list about: "${aiPromptFlashcard}". Create exactly 4 cards. Do not write any markdown outside the JSON block. Return ONLY a JSON object fitting this schema:
    {
      "cards": [
        { "front": "Question/Term", "back": "Brief explanation or answer" }
      ]
    }`;

        try {
            const response = await callGeminiWithBackoff(query, "You are a flashcard crafting bot. Return only a single valid JSON block.");
            const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;
            const cleanJsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
            const parsedData = JSON.parse(cleanJsonStr);

            if (parsedData.cards && parsedData.cards.length > 0) {
                const newDeck = {
                    id: `deck-${Date.now()}`,
                    title: `AI: ${aiPromptFlashcard.slice(0, 20)}...`,
                    subject: 'General Study',
                    cards: parsedData.cards
                };
                setFlashcardDecks(prev => [newDeck, ...prev]);
                setSelectedDeck(newDeck);
                triggerNotification('Deck Generated!', `AI successfully built 4 custom flashcards for "${aiPromptFlashcard}".`);
                setCurrentPage('flashcards');
            } else {
                throw new Error("Invalid structure returned from AI.");
            }
        } catch (err) {
            console.error(err);
            triggerNotification('AI Deck Failed', 'Failed to generate flashcards. Please check key or connectivity.');
        } finally {
            setAiGenerating(false);
        }
    };

    // AI Conversational Chat
    const handleSendMessageToAI = async () => {
        if (!aiUserInput.trim()) return;
        const userMessage = aiUserInput;
        setAiChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
        setAiUserInput('');
        setAiGenerating(true);

        try {
            const context = "You are Study Buddy's ultimate AI assistant. Give helpful, pedagogical explanations of study topics, equations, or histories. Keep it clear, concise, and professional.";
            const res = await callGeminiWithBackoff(userMessage, context);
            const outputText = res.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to retrieve a clear explanation. Please try again.";

            setAiChatHistory(prev => [...prev, { sender: 'assistant', text: outputText }]);
        } catch (err) {
            console.error(err);
            setAiChatHistory(prev => [...prev, { sender: 'assistant', text: "Oops! I ran into an error connecting to my digital intelligence center. Please ensure your API key settings or connection is solid." }]);
        } finally {
            setAiGenerating(false);
        }
    };

    // Create Custom Subject Goal
    const handleAddSubject = (e) => {
        e.preventDefault();
        if (!newSubjName.trim()) return;
        const newSubj = {
            id: `subj-${Date.now()}`,
            name: newSubjName,
            color: newSubjColor,
            goals: parseInt(newSubjGoals, 10) || 5,
            completed: 0
        };
        setSubjects(prev => [...prev, newSubj]);
        setNewSubjName('');
        setShowAddSubject(false);
        addXP(100);
        playSynthesizedTone('success');
        triggerNotification('Goal Added!', `Created educational tracker for "${newSubjName}".`);
    };

    // Create Assignment/Task
    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        const newTask = {
            id: `task-${Date.now()}`,
            title: newTaskTitle,
            subject: newTaskSubj,
            due: newTaskDue,
            priority: newTaskPriority,
            completed: false
        };
        setAssignments(prev => [newTask, ...prev]);
        setNewTaskTitle('');
        setShowAddTask(false);
        addXP(50);
        playSynthesizedTone('task');
        triggerNotification('Task Scheduled', `"${newTaskTitle}" added to your planner agenda.`);
    };

    // Toggle Complete Assignment
    const toggleTaskComplete = (id) => {
        setAssignments(prev => prev.map(task => {
            if (task.id === id) {
                const nextState = !task.completed;
                if (nextState) {
                    addXP(75);
                    playSynthesizedTone('success');
                    // Increment subject goal tracker if matched
                    setSubjects(subs => subs.map(sub => {
                        if (sub.name.toLowerCase() === task.subject.toLowerCase()) {
                            return { ...sub, completed: Math.min(sub.goals, sub.completed + 1) };
                        }
                        return sub;
                    }));
                    triggerNotification('Task Completed!', `Outstanding! Gained 75 XP.`);
                }
                return { ...task, completed: nextState };
            }
            return task;
        }));
    };

    // Delete Assignment
    const deleteTask = (id) => {
        setAssignments(prev => prev.filter(t => t.id !== id));
    };

    // Study Group Chat Message Sender
    const sendGroupChatMessage = () => {
        if (!newGroupMessage.trim()) return;
        const msg = {
            sender: userProfile.name,
            text: newGroupMessage,
            time: 'Just Now',
            isSelf: true
        };
        setGroupChats(prev => ({
            ...prev,
            [activeGroupRoom]: [...prev[activeGroupRoom], msg]
        }));
        setNewGroupMessage('');
        addXP(10);

        // Simulate interactive reply in 3 seconds
        setTimeout(() => {
            const buddies = ['Liam Parker', 'Emily Stone', 'Raj Patel', 'Sophie Chen'];
            const responseDrafts = [
                "That is a great perspective on this!",
                "Thanks for sharing that, really simplifies things.",
                "Could you post a screenshot or reference from the notes?",
                "Exactly, was stuck on that too!"
            ];
            const randomBuddy = buddies[Math.floor(Math.random() * buddies.length)];
            const randomReply = responseDrafts[Math.floor(Math.random() * responseDrafts.length)];

            setGroupChats(prev => ({
                ...prev,
                [activeGroupRoom]: [...prev[activeGroupRoom], {
                    sender: randomBuddy,
                    text: randomReply,
                    time: 'Just Now',
                    isSelf: false
                }]
            }));
            playSynthesizedTone('task');
        }, 3000);
    };

    // Notes CRUD helpers
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [noteFormTitle, setNoteFormTitle] = useState('');
    const [noteFormFolder, setNoteFormFolder] = useState('General');
    const [noteFormContent, setNoteFormContent] = useState('');

    const saveNote = () => {
        if (!noteFormTitle.trim()) return;
        if (editingNoteId) {
            setNotes(prev => prev.map(n => n.id === editingNoteId ? {
                ...n,
                title: noteFormTitle,
                folder: noteFormFolder,
                content: noteFormContent,
                updated: new Date().toISOString().split('T')[0]
            } : n));
            triggerNotification('Note Updated', `"${noteFormTitle}" successfully saved.`);
        } else {
            const newNote = {
                id: `note-${Date.now()}`,
                title: noteFormTitle,
                folder: noteFormFolder,
                content: noteFormContent,
                updated: new Date().toISOString().split('T')[0]
            };
            setNotes(prev => [newNote, ...prev]);
            addXP(40);
            triggerNotification('Note Saved', `"${noteFormTitle}" was catalogued.`);
        }
        setEditingNoteId(null);
        setNoteFormTitle('');
        setNoteFormContent('');
    };

    const startCreateNote = () => {
        setEditingNoteId(null);
        setNoteFormTitle('');
        setNoteFormFolder('General');
        setNoteFormContent('');
        setSelectedNotes('form');
    };

    const startEditNote = (note) => {
        setEditingNoteId(note.id);
        setNoteFormTitle(note.title);
        setNoteFormFolder(note.folder);
        setNoteFormContent(note.content);
        setSelectedNotes('form');
    };

    // Flashcards state helpers
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [cardFlipped, setCardFlipped] = useState(false);

    // Custom Flashcard Creation State
    const [newCardFront, setNewCardFront] = useState('');
    const [newCardBack, setNewCardBack] = useState('');
    const [flashcardDeckName, setFlashcardDeckName] = useState('');

    const createCustomDeck = () => {
        if (!flashcardDeckName.trim() || !newCardFront.trim() || !newCardBack.trim()) return;
        const newDeck = {
            id: `deck-${Date.now()}`,
            title: flashcardDeckName,
            subject: 'General Study',
            cards: [{ front: newCardFront, back: newCardBack }]
        };
        setFlashcardDecks(prev => [newDeck, ...prev]);
        setFlashcardDeckName('');
        setNewCardFront('');
        setNewCardBack('');
        addXP(100);
        triggerNotification('Deck Added', 'New educational stack created!');
    };

    const handleFlashcardRating = (scoreType) => {
        let earned = 10;
        if (scoreType === 'easy') earned = 25;
        if (scoreType === 'medium') earned = 15;
        addXP(earned);

        // Reset flip and transition index
        setCardFlipped(false);
        setTimeout(() => {
            if (activeCardIndex < selectedDeck.cards.length - 1) {
                setActiveCardIndex(prev => prev + 1);
            } else {
                triggerNotification('Deck Finished!', 'Gained knowledge and extra review experience point.');
                setActiveCardIndex(0);
            }
        }, 200);
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-[#0b0f19] text-gray-100' : 'bg-gray-50 text-gray-800'}`}>

            {/* Toast notifications portal */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {notifications.map(n => (
                    <div key={n.id} className="pointer-events-auto flex items-start gap-3 p-4 bg-indigo-600/95 backdrop-blur border border-indigo-400 text-white rounded-xl shadow-2xl animate-fade-in-left">
                        <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 animate-pulse" />
                        <div>
                            <h4 className="font-bold text-sm">{n.title}</h4>
                            <p className="text-xs text-indigo-100 mt-1">{n.msg}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MAIN LAYOUT SHELL --- */}
            <div className="flex">

                {/* --- SIDEBAR NAVIGATION --- */}
                {isLoggedIn && sidebarOpen && (
                    <aside className={`w-64 h-screen sticky top-0 flex-shrink-0 border-r flex flex-col justify-between ${isDarkMode ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className="p-5 flex flex-col gap-6 overflow-y-auto">

                            {/* App Brand */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <BrainCircuit className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-indigo-500 to-purple-400 bg-clip-text text-transparent">StudyBuddy</h1>
                                    <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Co-pilot Suite</span>
                                </div>
                            </div>

                            {/* User gamification summary */}
                            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-indigo-50/50 border-indigo-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <img src={userProfile.avatar} alt="User" className="w-9 h-9 rounded-full ring-2 ring-indigo-500" />
                                    <div className="truncate">
                                        <h3 className="font-bold text-sm truncate">{userProfile.name}</h3>
                                        <p className="text-xs text-gray-400 truncate">{userProfile.institution}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                    <span>Level {userProfile.level}</span>
                                    <span className="font-bold text-indigo-400">{userProfile.xp % (userProfile.level * 200)} / {userProfile.level * 200} XP</span>
                                </div>
                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                                        style={{ width: `${((userProfile.xp % (userProfile.level * 200)) / (userProfile.level * 200)) * 100}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-yellow-500">
                                    <Zap className="w-4 h-4 fill-current animate-bounce" />
                                    <span>{userProfile.streak} Day Study Streak!</span>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex flex-col gap-1">
                                {[
                                    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
                                    { id: 'planner', label: 'Study Planner', icon: CalendarIcon },
                                    { id: 'notes', label: 'Notes Notebook', icon: CheckCircle2 },
                                    { id: 'flashcards', label: 'Flashcards Stack', icon: Sparkles },
                                    { id: 'quiz', label: 'Interactive Quizzes', icon: BookOpenCheck },
                                    { id: 'groups', label: 'Study Rooms', icon: Users },
                                    { id: 'admin', label: 'Moderator Desk', icon: Shield },
                                ].map(item => {
                                    const Icon = item.icon;
                                    const isActive = currentPage === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setCurrentPage(item.id);
                                                if (item.id === 'quiz') setQuizRunning(false);
                                            }}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/10'
                                                    : `${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'}`
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>

                        </div>

                        {/* Bottom Panel Settings & Logins */}
                        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="Toggle Light/Dark Theme"
                                >
                                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsLoggedIn(false);
                                        setCurrentPage('landing');
                                    }}
                                    className="flex-1 px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 font-bold rounded-lg text-xs transition-all"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </aside>
                )}

                {/* --- MAIN PAGE VIEW CONTENT --- */}
                <main className="flex-1 min-h-screen flex flex-col">

                    {/* TOP BAR DESK */}
                    <header className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-40 backdrop-blur-md ${isDarkMode ? 'bg-[#0b0f19]/90 border-gray-800' : 'bg-white/95 border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            {isLoggedIn && (
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                >
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-black capitalize tracking-tight">
                                    {currentPage === 'quiz' && quizRunning ? 'Testing Arena' : `${currentPage} Dashboard`}
                                </h2>
                                <p className="text-xs text-gray-400">Welcome back, check your milestones and active tasks below.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* API KEY CONTROLLER CARD */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Enter Gemini API Key..."
                                        value={aiApiKey}
                                        onChange={(e) => setAiApiKey(e.target.value)}
                                        className={`pl-8 pr-3 py-1.5 rounded-lg text-xs w-48 border transition-all ${isDarkMode
                                                ? 'bg-gray-950/80 border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-300'
                                                : 'bg-white border-gray-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-gray-700'
                                            }`}
                                    />
                                    <Zap className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-[10px] text-gray-400 hidden sm:block">
                                    {aiApiKey ? <span className="text-emerald-400 font-bold">API Key Loaded</span> : <span>Free Mode Inactive</span>}
                                </div>
                            </div>

                            {/* STAT MINI PILLS */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                                    <Award className="w-4 h-4" />
                                    <span>{userProfile.xp} XP</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                    <Zap className="w-4 h-4 fill-current" />
                                    <span>{userProfile.streak} Days</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* PAGE INNER CONDITIONAL DISPATCHER */}
                    <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">

                        {/* 1. LANDING WELCOME PAGE */}
                        {!isLoggedIn && currentPage === 'landing' && (
                            <div className="max-w-4xl mx-auto text-center py-12 flex flex-col items-center gap-8">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                                    <BrainCircuit className="w-12 h-12 text-white animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-extrabold uppercase tracking-widest border border-indigo-500/20">The Smart Student Hub</span>
                                    <h1 className="text-5xl font-black tracking-tight leading-none">
                                        Achieve Academic Mastery with <br />
                                        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">StudyBuddy Suite</span>
                                    </h1>
                                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                                        Plan your study schedules, master flashcards with spaced repetition, synthesize focused ambient environments, and leverage AI models for tailored exam prep.
                                    </p>
                                </div>

                                {/* Simulated Login Panel */}
                                <div className={`p-8 rounded-2xl border max-w-md w-full text-left ${isDarkMode ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <h3 className="text-xl font-bold mb-2">Initialize Your Workstation</h3>
                                    <p className="text-xs text-gray-400 mb-6">Enter your details or log in with mock credentials to experience full functionality.</p>

                                    <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setCurrentPage('dashboard'); }} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={userProfile.name}
                                                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                                                className={`w-full p-3 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={userProfile.email}
                                                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                                                className={`w-full p-3 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Institution</label>
                                            <input
                                                type="text"
                                                value={userProfile.institution}
                                                onChange={(e) => setUserProfile({ ...userProfile, institution: e.target.value })}
                                                className={`w-full p-3 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all">
                                            <span>Launch Companion Space</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* 2. CORE INTERACTIVE DASHBOARD */}
                        {isLoggedIn && currentPage === 'dashboard' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Left & Mid Main Dashboard Column */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* QUOTE AND STATS CARD */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/15 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <BrainCircuit className="w-36 h-36" />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <Sparkles className="w-5 h-5 animate-spin" />
                                                <span className="text-xs font-extrabold uppercase tracking-widest">Daily Motivation</span>
                                            </div>
                                            <blockquote className="text-lg md:text-xl font-bold leading-snug">
                                                "{randomQuote.text}"
                                            </blockquote>
                                            <cite className="block text-xs font-semibold text-gray-400">— {randomQuote.author}</cite>
                                        </div>
                                    </div>

                                    {/* ACTIVE POMODORO WIDGET */}
                                    <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-indigo-500" />
                                                <h3 className="font-extrabold text-sm uppercase tracking-wider">Pomodoro focus station</h3>
                                            </div>
                                            <div className="flex gap-2">
                                                {['focus', 'shortBreak', 'longBreak'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => {
                                                            setPomoMode(mode);
                                                            setPomoActive(false);
                                                            setPomoTimeLeft(mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60);
                                                        }}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${pomoMode === mode
                                                                ? 'bg-indigo-600 text-white'
                                                                : `${isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                                                            }`}
                                                    >
                                                        {mode === 'focus' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Rest' : 'Long Rest'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                            <div className="text-center py-6 border-r border-gray-800/40">
                                                <div className="text-6xl font-black tracking-widest font-mono text-indigo-400 mb-4 animate-pulse">
                                                    {formatTime(pomoTimeLeft)}
                                                </div>
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => setPomoActive(!pomoActive)}
                                                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                                                    >
                                                        {pomoActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                                                        <span>{pomoActive ? 'Pause Session' : 'Start Focus'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPomoActive(false);
                                                            setPomoTimeLeft(pomoMode === 'focus' ? 25 * 60 : pomoMode === 'shortBreak' ? 5 * 60 : 15 * 60);
                                                        }}
                                                        className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
                                                        title="Reset Timer"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Ambient noise syntheziser */}
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Audio Ambient Track generator</h4>
                                                <p className="text-[11px] text-gray-400">Synthesize dynamic noise channels (using Web Audio synthesis) to mask environmental chaos:</p>

                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { id: 'none', label: 'No Audio', icon: VolumeX },
                                                        { id: 'rain', label: 'Falling Rain', icon: Volume2 },
                                                        { id: 'ocean', label: 'Deep Ocean', icon: Volume2 },
                                                        { id: 'forest', label: 'Forest Wind', icon: Volume2 },
                                                    ].map(sound => (
                                                        <button
                                                            key={sound.id}
                                                            onClick={() => setAmbientSound(sound.id)}
                                                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${ambientSound === sound.id
                                                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                                                    : `${isDarkMode ? 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`
                                                                }`}
                                                        >
                                                            <sound.icon className="w-4 h-4" />
                                                            <span>{sound.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* HIGH PRIORITY ASSIGNMENT PANEL */}
                                    <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                                <h3 className="font-extrabold text-sm uppercase tracking-wider">Your Pending Tasks</h3>
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage('planner')}
                                                className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
                                            >
                                                <span>Go to full planner</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {assignments.filter(a => !a.completed).slice(0, 3).map(task => (
                                                <div
                                                    key={task.id}
                                                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${isDarkMode ? 'bg-gray-950/60 border-gray-800/80 hover:bg-gray-950' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        <button
                                                            onClick={() => toggleTaskComplete(task.id)}
                                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-gray-600 hover:border-indigo-400'
                                                                }`}
                                                        >
                                                            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                        </button>
                                                        <div className="truncate">
                                                            <h4 className="font-bold text-xs truncate">{task.title}</h4>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold mt-1 inline-block">
                                                                {task.subject}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-[10px] text-gray-400">Due: {task.due}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                                                            }`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {assignments.filter(a => !a.completed).length === 0 && (
                                                <div className="text-center py-6 text-gray-500 text-xs">
                                                    All tasks fully finished! Reward yourself with a break. 🎉
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Right Side Column (AI Prompt Panel & Subjects) */}
                                <div className="space-y-6">

                                    {/* GENERATIVE AI SIDE-DESK */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-950 border border-indigo-500/25 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <BrainCircuit className="w-5 h-5 animate-pulse" />
                                                <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">AI Quick Generation Desk</h3>
                                            </div>
                                            <p className="text-[11px] text-indigo-200">Generate learning sets automatically on any topic using Google Gemini intelligence:</p>

                                            <div className="space-y-3">
                                                {/* Quick Flashcard Prompt */}
                                                <div>
                                                    <label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">Create Flashcard Deck</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Organic Chemistry"
                                                            value={aiPromptFlashcard}
                                                            onChange={(e) => setAiPromptFlashcard(e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-indigo-950/80 border border-indigo-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                                                        />
                                                        <button
                                                            onClick={generateAIFlashcards}
                                                            disabled={aiGenerating || !aiPromptFlashcard.trim()}
                                                            className="px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                                                        >
                                                            {aiGenerating ? '...' : 'Build'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Quick Quiz Generator */}
                                                <div>
                                                    <label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">Create 5-Question Quiz</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. World War II Causes"
                                                            value={aiPromptQuiz}
                                                            onChange={(e) => setAiPromptQuiz(e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-indigo-950/80 border border-indigo-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                                                        />
                                                        <button
                                                            onClick={generateAIQuiz}
                                                            disabled={aiGenerating || !aiPromptQuiz.trim()}
                                                            className="px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                                                        >
                                                            {aiGenerating ? '...' : 'Build'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setCurrentPage('quiz')}
                                                    className="w-full py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                                                >
                                                    <span>Open full AI Chat Room</span>
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CORE SUBJECTS GOAL TRACKER */}
                                    <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Subject Goals Progress</h3>
                                            <button
                                                onClick={() => setShowAddSubject(true)}
                                                className="p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 transition-all"
                                                title="Add Subject Tracker"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {subjects.map(sub => {
                                                const percent = sub.goals > 0 ? (sub.completed / sub.goals) * 100 : 0;
                                                return (
                                                    <div key={sub.id} className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-bold flex items-center gap-1.5">
                                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                                                                {sub.name}
                                                            </span>
                                                            <span className="text-gray-400 font-semibold">{sub.completed} / {sub.goals} Targets</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-300"
                                                                style={{ width: `${percent}%`, backgroundColor: sub.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Show Quick Add Subject Goals */}
                                        {showAddSubject && (
                                            <form onSubmit={handleAddSubject} className="mt-4 p-4 border border-indigo-500/20 rounded-xl bg-indigo-500/5 space-y-3">
                                                <h4 className="text-xs font-bold text-indigo-400">Track New subject</h4>
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. Physics, Literature"
                                                        value={newSubjName}
                                                        onChange={(e) => setNewSubjName(e.target.value)}
                                                        className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs"
                                                    />
                                                    <div className="flex justify-between gap-2">
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] text-gray-400 uppercase mb-0.5">Subj Color</label>
                                                            <input
                                                                type="color"
                                                                value={newSubjColor}
                                                                onChange={(e) => setNewSubjColor(e.target.value)}
                                                                className="w-full bg-transparent h-8"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] text-gray-400 uppercase mb-0.5">Task Goal</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={newSubjGoals}
                                                                onChange={(e) => setNewSubjGoals(e.target.value)}
                                                                className="w-full px-2 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-center"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 text-xs">
                                                    <button type="button" onClick={() => setShowAddSubject(false)} className="px-3 py-1 bg-gray-800 rounded-lg">Cancel</button>
                                                    <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold">Add</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>

                                </div>

                            </div>
                        )}

                        {/* 3. STUDY PLANNER / TIMETABLE PAGE */}
                        {isLoggedIn && currentPage === 'planner' && (
                            <div className="space-y-6">

                                {/* TIMETABLE VIEW */}
                                <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5 text-indigo-500" />
                                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Weekly Class Timetable</h3>
                                        </div>
                                        <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                            Academic Schedule
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        {timetable.map((item, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-950/40 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                                                <h4 className="font-black text-xs uppercase text-indigo-400 mb-3 border-b border-gray-800/60 pb-1">{item.day}</h4>
                                                <div className="space-y-2">
                                                    {item.slots.map((slot, sIdx) => (
                                                        <div key={sIdx} className={`p-2.5 rounded-lg text-xs ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border border-gray-800/40`}>
                                                            <div className="font-bold text-gray-300">{slot.subject}</div>
                                                            <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                                                                <span>{slot.time}</span>
                                                                <span className="text-indigo-400 font-semibold">{slot.location}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TASK & ASSIGNMENT LIST CONTROLLER */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                    {/* PENDING ASSIGNMENTS LIST */}
                                    <div className={`lg:col-span-2 p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h3 className="font-extrabold text-sm uppercase tracking-wider">Assignments Manager</h3>
                                                <p className="text-xs text-gray-400">Add, track, and complete homework and exam review milestones.</p>
                                            </div>
                                            <button
                                                onClick={() => setShowAddTask(true)}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Add Task</span>
                                            </button>
                                        </div>

                                        {showAddTask && (
                                            <form onSubmit={handleAddTask} className="mb-6 p-4 border border-indigo-500/20 rounded-xl bg-indigo-500/5 space-y-4 animate-fade-in-down">
                                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Schedule New Assignment Task</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Task / Assignment Title</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="e.g. Mitosis essay rewrite"
                                                            value={newTaskTitle}
                                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Class Subject</label>
                                                        <select
                                                            value={newTaskSubj}
                                                            onChange={(e) => setNewTaskSubj(e.target.value)}
                                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs"
                                                        >
                                                            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Deadline Date</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={newTaskDue}
                                                            onChange={(e) => setNewTaskDue(e.target.value)}
                                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Priority Metric</label>
                                                        <select
                                                            value={newTaskPriority}
                                                            onChange={(e) => setNewTaskPriority(e.target.value)}
                                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs"
                                                        >
                                                            <option value="High">High Priority</option>
                                                            <option value="Medium">Medium Priority</option>
                                                            <option value="Low">Low Priority</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => setShowAddTask(false)} className="px-4 py-2 bg-gray-800 rounded-lg text-xs">Cancel</button>
                                                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold">Add Assignment</button>
                                                </div>
                                            </form>
                                        )}

                                        <div className="space-y-2">
                                            {assignments.map(task => (
                                                <div
                                                    key={task.id}
                                                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${task.completed
                                                            ? 'opacity-60 bg-gray-900/20 border-gray-800/40'
                                                            : `${isDarkMode ? 'bg-gray-950/60 border-gray-800 hover:bg-gray-950' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        <button
                                                            onClick={() => toggleTaskComplete(task.id)}
                                                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-gray-600 hover:border-indigo-400'
                                                                }`}
                                                        >
                                                            {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                                        </button>
                                                        <div className="truncate">
                                                            <h4 className={`font-bold text-sm truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                                                {task.title}
                                                            </h4>
                                                            <div className="flex gap-2 mt-1">
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold">
                                                                    {task.subject}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">Due: {task.due}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                                                            }`}>
                                                            {task.priority}
                                                        </span>
                                                        <button
                                                            onClick={() => deleteTask(task.id)}
                                                            className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* PLANNER INSIGHTS CARDS */}
                                    <div className="space-y-6">
                                        <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                            <h4 className="font-extrabold text-sm uppercase tracking-wider mb-4">Planner Insights</h4>
                                            <div className="space-y-3 text-xs">
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                                                    <span>Total Assignments</span>
                                                    <span className="font-extrabold">{assignments.length}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                    <span>Completed Tasks</span>
                                                    <span className="font-extrabold">{assignments.filter(a => a.completed).length}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-rose-500/10 text-rose-400">
                                                    <span>Pending Deadline</span>
                                                    <span className="font-extrabold">{assignments.filter(a => !a.completed).length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        )}

                        {/* 4. NOTES / FOLDER INTEGRATION PAGE */}
                        {isLoggedIn && currentPage === 'notes' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Left side panel: Note collections */}
                                <div className="space-y-6">
                                    <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Lectures Notebook</h3>
                                            <button
                                                onClick={startCreateNote}
                                                className="p-1.5 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 transition-all"
                                                title="New Note"
                                            >
                                                <FolderPlus className="w-4.5 h-4.5" />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {notes.map(note => (
                                                <div
                                                    key={note.id}
                                                    onClick={() => {
                                                        setSelectedNotes('view');
                                                        setEditingNoteId(note.id);
                                                        setNoteFormTitle(note.title);
                                                        setNoteFormFolder(note.folder);
                                                        setNoteFormContent(note.content);
                                                    }}
                                                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${editingNoteId === note.id
                                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                                            : `${isDarkMode ? 'bg-gray-950/60 border-gray-800 hover:bg-gray-950' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <h4 className="font-bold text-xs truncate">{note.title}</h4>
                                                    <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                                                        <span className="bg-gray-800/80 px-2 py-0.5 rounded-full">{note.folder}</span>
                                                        <span>Updated: {note.updated}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right side panel: Note edit or detail view */}
                                <div className="lg:col-span-2 space-y-6">
                                    {selectedNotes === 'form' ? (
                                        <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-extrabold text-sm uppercase tracking-widest">{editingNoteId ? 'Edit Note' : 'Draft New Note'}</h3>
                                                <button
                                                    onClick={saveNote}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    <span>Save Changes</span>
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Title</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Mitosis Lecture Note"
                                                            value={noteFormTitle}
                                                            onChange={(e) => setNoteFormTitle(e.target.value)}
                                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Subject Folder</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Biology"
                                                            value={noteFormFolder}
                                                            onChange={(e) => setNoteFormFolder(e.target.value)}
                                                            className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Content (supports Markdown syntax)</label>
                                                    <textarea
                                                        rows="12"
                                                        placeholder="Type lecture details, summary terms, or textbook summaries..."
                                                        value={noteFormContent}
                                                        onChange={(e) => setNoteFormContent(e.target.value)}
                                                        className="w-full p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs font-mono resize-none focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : editingNoteId ? (
                                        <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <h3 className="font-extrabold text-lg text-indigo-400">{noteFormTitle}</h3>
                                                    <span className="text-xs text-gray-400">Folder: {noteFormFolder}</span>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedNotes('form')}
                                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs flex items-center gap-1.5"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                    <span>Edit Note</span>
                                                </button>
                                            </div>

                                            <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
                                                <pre className="text-xs whitespace-pre-wrap font-sans text-gray-300">
                                                    {noteFormContent}
                                                </pre>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-400 text-sm">
                                            Select or draft a new note from the left shelf pane to review your logs.
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}

                        {/* 5. INTERACTIVE FLASHCARDS WITH SPACE REPETITION */}
                        {isLoggedIn && currentPage === 'flashcards' && (
                            <div className="space-y-6">

                                {/* SELECT DECK SHELF */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* CREATE DECK CONTROLLER */}
                                    <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-indigo-400 flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4" />
                                            Create Custom Card Deck
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Deck Title Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Micro Economics"
                                                    value={flashcardDeckName}
                                                    onChange={(e) => setFlashcardDeckName(e.target.value)}
                                                    className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Card Front (Concept)</label>
                                                <input
                                                    type="text"
                                                    placeholder="What is supply-demand?"
                                                    value={newCardFront}
                                                    onChange={(e) => setNewCardFront(e.target.value)}
                                                    className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Card Back (Definition)</label>
                                                <textarea
                                                    rows="2"
                                                    placeholder="The aggregate model determining equilibrium pricing..."
                                                    value={newCardBack}
                                                    onChange={(e) => setNewCardBack(e.target.value)}
                                                    className="w-full p-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white resize-none"
                                                />
                                            </div>
                                            <button
                                                onClick={createCustomDeck}
                                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold text-white transition-all"
                                            >
                                                Create Deck Stack
                                            </button>
                                        </div>
                                    </div>

                                    {/* SELECT DECK PANEL */}
                                    <div className={`md:col-span-2 p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4">Available Study Cards</h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {flashcardDecks.map(deck => (
                                                <div
                                                    key={deck.id}
                                                    onClick={() => {
                                                        setSelectedDeck(deck);
                                                        setActiveCardIndex(0);
                                                        setCardFlipped(false);
                                                    }}
                                                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${selectedDeck?.id === deck.id
                                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                                            : `${isDarkMode ? 'bg-gray-950/60 border-gray-800 hover:bg-gray-950' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <h4 className="font-bold text-sm truncate">{deck.title}</h4>
                                                    <span className="text-[10px] text-gray-400 mt-1 inline-block">Subject: {deck.subject}</span>
                                                    <div className="flex justify-between items-center mt-3 text-xs">
                                                        <span className="font-semibold text-gray-400">{deck.cards.length} Interactive Cards</span>
                                                        <span className="text-indigo-400 flex items-center gap-0.5">
                                                            Practice <ChevronRight className="w-4.5 h-4.5" />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                {/* ACTIVE FLASHCARD GAME ENGINE */}
                                {selectedDeck && (
                                    <div className="max-w-xl mx-auto py-6">
                                        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                            <span>Stack Practice: {selectedDeck.title}</span>
                                            <span>Card {activeCardIndex + 1} of {selectedDeck.cards.length}</span>
                                        </div>

                                        {/* Flipping animation box */}
                                        <div
                                            onClick={() => setCardFlipped(!cardFlipped)}
                                            className="cursor-pointer select-none"
                                        >
                                            <div className={`min-h-[220px] rounded-2xl border flex flex-col justify-between p-6 transition-all duration-500 shadow-2xl relative ${cardFlipped
                                                    ? 'bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900 border-indigo-400 text-white'
                                                    : `${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 text-gray-800'}`
                                                }`}>

                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-right">
                                                    {cardFlipped ? 'Answer/Explanation' : 'Concept Question'}
                                                </div>

                                                <div className="py-8 text-center text-lg md:text-xl font-bold">
                                                    {cardFlipped ? selectedDeck.cards[activeCardIndex].back : selectedDeck.cards[activeCardIndex].front}
                                                </div>

                                                <div className="text-[10px] text-center text-gray-400 italic">
                                                    Click card space to flip & reveal logic
                                                </div>

                                            </div>
                                        </div>

                                        {/* Spaced repetition scoring buttons */}
                                        {cardFlipped && (
                                            <div className="grid grid-cols-3 gap-2 mt-4 animate-fade-in-up">
                                                <button
                                                    onClick={() => handleFlashcardRating('hard')}
                                                    className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold rounded-xl text-xs transition-all border border-rose-500/25"
                                                >
                                                    Hard (+10 XP)
                                                </button>
                                                <button
                                                    onClick={() => handleFlashcardRating('medium')}
                                                    className="p-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-extrabold rounded-xl text-xs transition-all border border-yellow-500/25"
                                                >
                                                    Medium (+15 XP)
                                                </button>
                                                <button
                                                    onClick={() => handleFlashcardRating('easy')}
                                                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold rounded-xl text-xs transition-all border border-emerald-500/25"
                                                >
                                                    Easy (+25 XP)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        )}

                        {/* 6. INTERACTIVE QUIZ MODE */}
                        {isLoggedIn && currentPage === 'quiz' && (
                            <div className="space-y-6">
                                {!quizRunning ? (
                                    <div className="max-w-2xl mx-auto text-center py-12 space-y-6">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 flex items-center justify-center mx-auto text-indigo-400">
                                            <BookOpenCheck className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-extrabold">Active Assessment Hub</h2>
                                            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-2">
                                                To activate multiple choice quizzes, generate an instant deck using the AI Prompt box or click standard practice mocks below.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                                            <div
                                                onClick={() => {
                                                    setQuizQuestions([
                                                        { question: 'Which organelle serves as the principal hub of cell respiration and energy production?', options: ['Nucleus', 'Mitochondria', 'Lysosome', 'Ribosome'], correctAnswer: 'Mitochondria', explanation: 'Mitochondria generates ATP.' },
                                                        { question: 'What formula expresses derivatives power rule?', options: ['d/dx(x^n)=nx^(n-1)', 'd/dx(uv)=uv\'+vu\'', 'd/dx(e^x)=e^x', 'None'], correctAnswer: 'd/dx(x^n)=nx^(n-1)', explanation: 'The power rule is a standard formula.' }
                                                    ]);
                                                    setQuizScore(0);
                                                    setCurrentQuizIdx(0);
                                                    setSelectedQuizAnswer(null);
                                                    setQuizFinished(false);
                                                    setQuizRunning(true);
                                                    setQuizTimer(0);
                                                }}
                                                className={`p-4 rounded-xl border cursor-pointer hover:border-indigo-500 transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                                            >
                                                <h4 className="font-bold text-sm">General Science Mock</h4>
                                                <span className="text-[10px] text-gray-400 block mt-1">2 Questions | High Quality Explanation</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto">

                                        {/* Header stats */}
                                        <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-4">
                                            <span>Quiz Timer: {quizTimer}s</span>
                                            <span>Score: {quizScore} / {quizQuestions.length}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-6">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all"
                                                style={{ width: `${((currentQuizIdx) / quizQuestions.length) * 100}%` }}
                                            />
                                        </div>

                                        {!quizFinished ? (
                                            <div className="space-y-6">
                                                <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                                    <h3 className="font-bold text-base mb-4">
                                                        Q{currentQuizIdx + 1}: {quizQuestions[currentQuizIdx].question}
                                                    </h3>

                                                    <div className="space-y-2">
                                                        {quizQuestions[currentQuizIdx].options.map((opt, idx) => {
                                                            const isSelected = selectedQuizAnswer === opt;
                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => setSelectedQuizAnswer(opt)}
                                                                    className={`w-full p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${isSelected
                                                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                                                            : `${isDarkMode ? 'bg-gray-950/60 border-gray-800 hover:bg-gray-900' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                                                                        }`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {selectedQuizAnswer && (
                                                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-xs text-indigo-300">
                                                        <strong>Explanation:</strong> {quizQuestions[currentQuizIdx].explanation}
                                                    </div>
                                                )}

                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => {
                                                            if (!selectedQuizAnswer) return;
                                                            if (selectedQuizAnswer === quizQuestions[currentQuizIdx].correctAnswer) {
                                                                setQuizScore(prev => prev + 1);
                                                                addXP(50);
                                                            }

                                                            if (currentQuizIdx < quizQuestions.length - 1) {
                                                                setCurrentQuizIdx(prev => prev + 1);
                                                                setSelectedQuizAnswer(null);
                                                            } else {
                                                                setQuizFinished(true);
                                                                if (quizIntervalRef.current) clearInterval(quizIntervalRef.current);
                                                            }
                                                        }}
                                                        disabled={!selectedQuizAnswer}
                                                        className="px-6 py-2.5 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all"
                                                    >
                                                        <span>{currentQuizIdx === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-6">
                                                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                                    <Check className="w-8 h-8 stroke-[3]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-extrabold">Quiz Completed!</h3>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        Excellent work. You correctly answered {quizScore} out of {quizQuestions.length} questions in {quizTimer} seconds.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setQuizRunning(false)}
                                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all"
                                                >
                                                    Return to Hub
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>
                        )}

                        {/* 7. STUDY GROUPS SIMULATION ROOMS */}
                        {isLoggedIn && currentPage === 'groups' && (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                                {/* Side Selector column */}
                                <div className="space-y-6">
                                    <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                        <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-indigo-400">Available Study Rooms</h3>
                                        <div className="space-y-2">
                                            {CHAT_ROOMS.map(room => (
                                                <button
                                                    key={room.id}
                                                    onClick={() => setActiveGroupRoom(room.id)}
                                                    className={`w-full p-3 rounded-xl border text-left transition-all ${activeGroupRoom === room.id
                                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                                                            : `${isDarkMode ? 'bg-gray-950/60 border-gray-800 hover:bg-gray-900' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <div className="font-bold text-xs flex justify-between">
                                                        <span>#{room.name}</span>
                                                        <span className="text-[10px] text-gray-400">{room.users} online</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 mt-1 block">Course: {room.subject}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Interactive Chat Area */}
                                <div className="lg:col-span-3 space-y-6">
                                    <div className={`p-6 rounded-2xl border flex flex-col h-[500px] justify-between ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>

                                        {/* Header bar */}
                                        <div className="border-b border-gray-800/40 pb-3 flex justify-between items-center text-xs">
                                            <div>
                                                <h4 className="font-bold text-sm text-indigo-400">#{CHAT_ROOMS.find(r => r.id === activeGroupRoom)?.name}</h4>
                                                <span className="text-[10px] text-gray-400">Active collaborative peer chat</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 text-indigo-400">
                                                <Users className="w-4 h-4" />
                                                <span>Online Buddy Pool</span>
                                            </div>
                                        </div>

                                        {/* Chat Bubble Thread */}
                                        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                                            {groupChats[activeGroupRoom].map((msg, idx) => (
                                                <div key={idx} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex gap-2 items-center mb-1">
                                                        <span className="text-[10px] font-bold text-gray-400">{msg.sender}</span>
                                                        <span className="text-[9px] text-gray-500">{msg.time}</span>
                                                    </div>
                                                    <div className={`p-3 rounded-2xl text-xs max-w-sm ${msg.isSelf
                                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                                            : `${isDarkMode ? 'bg-gray-950/80 border border-gray-800' : 'bg-indigo-50/50 border border-indigo-100'} text-gray-300 rounded-tl-none`
                                                        }`}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Messenger input tool */}
                                        <div className="border-t border-gray-800/40 pt-4 flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Say something to the group workspace room..."
                                                value={newGroupMessage}
                                                onChange={(e) => setNewGroupMessage(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && sendGroupChatMessage()}
                                                className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                                            />
                                            <button
                                                onClick={sendGroupChatMessage}
                                                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        )}

                        {/* 8. MODERATOR DESK / ADMIN DASHBOARD */}
                        {isLoggedIn && currentPage === 'admin' && (
                            <div className="space-y-6">

                                {/* Admin Analytic highlights */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { title: 'Total Registered Students', value: '45,201', desc: '+12% this semester' },
                                        { title: 'AI Tokens Synthesized', value: '1.2M', desc: 'Average 210/student' },
                                        { title: 'System Active Uptime', value: '99.98%', desc: 'No active downtime reported' },
                                        { title: 'Flagged Comments', value: '0', desc: 'Healthy learning community' }
                                    ].map((stat, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</h4>
                                            <div className="text-2xl font-black mt-2 text-indigo-400">{stat.value}</div>
                                            <span className="text-[10px] text-emerald-400 block mt-1">{stat.desc}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Operational log table mock */}
                                <div className={`p-6 rounded-2xl border ${CARD_BG} ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4">Realtime Server Systems Logs</h3>
                                    <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl font-mono text-[11px] text-gray-400 space-y-1.5 h-64 overflow-y-auto">
                                        <div>[2026-06-30 01:13:00] INF: Gemini AI model parsed structured json for flashcard schema.</div>
                                        <div>[2026-06-30 01:11:45] INF: AudioContext initialized. Synth Ambient Ocean wave active.</div>
                                        <div>[2026-06-30 01:10:22] INF: User Alex Rivera earned 75 XP for Task Calc assignment.</div>
                                        <div>[2026-06-30 01:08:12] INF: Group Calculus Club connected: socket pool stable.</div>
                                        <div>[2026-06-30 01:05:00] WRN: Free tier rate limited query retry 1 executed with backoff.</div>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>

                </main>
            </div>

        </div>
    );
}