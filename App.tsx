import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Activity, Dumbbell, Calendar, ClipboardList, Play, Pause, CheckCircle2, 
  Plus, Trash2, Flame, Droplets, Timer, BarChart3, ChevronRight, ChevronLeft, 
  ChevronDown, ChevronUp, Check, ArrowLeft, Save, Clock, Zap, Weight, Info, 
  Search, X, TrendingUp, Filter, RefreshCw, AlertTriangle, Edit3, Mail, Lock, User as UserIcon, LogOut, Camera, Minus, Settings
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

import { AppView, Exercise, WorkoutLog, WorkoutSet, UserProfile, WorkoutPlanItem, ExerciseSessionData, SavedSessionState } from './types';
import { EXERCISE_DB, MOCK_LOGS, MOCK_WORKOUT_PLAN, MOCK_HISTORY_SETS } from './constants';
import { calculate1RM, calculateApexFitCalories, calculateAverageMets, formatTime, dateKey, calculateBMR, calculateTDEE, calculateDailyWaterGoal } from './utils/formulas';

// --- Sub-Components ---

const CompactNumberControl = ({ value, onChange, label }: { value: number, onChange: (val: number) => void, label: string }) => {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider ml-1">{label}</span>
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 h-10 overflow-hidden">
                <button 
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="h-full px-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-r border-slate-700"
                >
                    <Minus size={14} />
                </button>
                <input 
                    type="number" 
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full bg-transparent text-center text-sm font-bold text-white outline-none appearance-none"
                />
                <button 
                    onClick={() => onChange(value + 1)}
                    className="h-full px-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-l border-slate-700"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
};

const NumberInputControl = ({ value, onChange, label, className = "", disabled = false }: { value: number, onChange: (val: number) => void, label: string, className?: string, disabled?: boolean }) => {
  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-700 relative flex items-center overflow-hidden ${className} ${disabled ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
        <div className="flex-1 px-4 py-3">
            <div className="text-[10px] text-muted mb-0.5 uppercase tracking-wider font-bold">{label}</div>
            <input 
                type="number" 
                value={value} 
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full bg-transparent font-bold outline-none appearance-none font-mono text-xl text-white"
            />
        </div>
        <div className="flex flex-col border-l border-slate-700 self-stretch w-12">
            <button disabled={disabled} onClick={() => onChange(value + 1)} className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-muted hover:text-white flex items-center justify-center border-b border-slate-700 active:bg-slate-600 transition-colors"><ChevronUp size={18} /></button>
            <button disabled={disabled} onClick={() => onChange(value > 0 ? value - 1 : 0)} className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-muted hover:text-white flex items-center justify-center active:bg-slate-600 transition-colors"><ChevronDown size={18} /></button>
        </div>
    </div>
  );
}

const SearchableDropdown = ({ options, value, onChange, placeholder = "Выберите..." }: { options: {value: string, label: string}[], value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative w-full max-w-[240px]" ref={wrapperRef}>
      <button className="w-full bg-slate-800 border border-slate-600 rounded-lg flex items-center justify-between px-3 py-2 text-xs outline-none focus:border-primary transition-colors" onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearch(""); }}>
        <span className="truncate mr-2 text-slate-200">{selectedLabel}</span>
        <ChevronDown className="w-3 h-3 text-muted" />
      </button>
      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-slate-700 bg-slate-800/95 backdrop-blur">
             <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 focus-within:border-primary transition-colors">
                <Search className="w-3 h-3 text-muted mr-2" />
                <input autoFocus type="text" className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-slate-500" placeholder="Поиск упражнения..." value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
             </div>
          </div>
          <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                <button key={opt.value} className={`w-full text-left px-3 py-2.5 text-xs hover:bg-slate-700 transition-colors flex items-center justify-between ${opt.value === value ? 'bg-primary/10 text-primary' : 'text-slate-300'}`} onClick={() => { onChange(opt.value); setIsOpen(false); }}>
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3 h-3" />}
                </button>
              )) : <div className="px-3 py-4 text-xs text-muted text-center">Ничего не найдено</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- AUTH & ONBOARDING COMPONENTS ---

const LegalText = ({ type, onBack }: { type: 'tos' | 'privacy', onBack: () => void }) => {
    return (
        <div className="h-full bg-background p-6 animate-fade-in overflow-y-auto pb-20">
            <button onClick={onBack} className="flex items-center text-primary mb-6"><ArrowLeft className="w-5 h-5 mr-2" /> Назад</button>
            {type === 'tos' ? (
                <div>
                    <h1 className="text-2xl font-bold mb-4">Условия использования</h1>
                    <p className="text-muted text-sm mb-4">Добро пожаловать в ApexFit. Используя это приложение, вы соглашаетесь с нижеследующими условиями.</p>
                    <h3 className="font-bold text-white mb-2">1. Использование сервиса</h3>
                    <p className="text-muted text-sm mb-4">Приложение предоставляется "как есть". Мы не несем ответственности за травмы, полученные при выполнении упражнений. Проконсультируйтесь с врачом перед началом тренировок.</p>
                    <h3 className="font-bold text-white mb-2">2. Учетная запись</h3>
                    <p className="text-muted text-sm mb-4">Вы несете ответственность за безопасность вашего аккаунта. Мы оставляем за собой право удалить аккаунт при нарушении правил.</p>
                </div>
            ) : (
                <div>
                    <h1 className="text-2xl font-bold mb-4">Политика конфиденциальности</h1>
                    <p className="text-muted text-sm mb-4">Мы ценим вашу приватность. Вот как мы работаем с вашими данными.</p>
                    <h3 className="font-bold text-white mb-2">Какие данные мы собираем</h3>
                    <p className="text-muted text-sm mb-4">Мы собираем email для входа, а также данные профиля (рост, вес, пол, возраст) и тренировочную активность для расчетов и персонализации.</p>
                    <h3 className="font-bold text-white mb-2">Где хранятся данные</h3>
                    <p className="text-muted text-sm mb-4">Данные хранятся на защищенных серверах и кешируются локально на вашем устройстве в зашифрованном виде.</p>
                    <h3 className="font-bold text-white mb-2">Передача третьим лицам</h3>
                    <p className="text-muted text-sm mb-4">Мы не продаем ваши данные. Данные могут передаваться провайдерам авторизации (Google/Apple) только для обеспечения входа.</p>
                </div>
            )}
        </div>
    )
}

const LoginScreen = ({ onLoginSuccess, onViewLegal }: { onLoginSuccess: (email: string) => void, onViewLegal: (type: 'tos'|'privacy') => void }) => {
    const [email, setEmail] = useState("");
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(30);
    const [error, setError] = useState("");
    const [generatedCode, setGeneratedCode] = useState("");
    const [mockNotification, setMockNotification] = useState<string | null>(null);

    useEffect(() => {
        let interval: any;
        if (showOtp && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [showOtp, timer]);

    const handleSendCode = () => {
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError("Введите корректный email");
            return;
        }
        setError("");
        
        // Generate random 6-digit code for simulation
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        
        setShowOtp(true);
        setTimer(30);
        
        // Simulate email delivery with an in-app toast
        setTimeout(() => {
            setMockNotification(code);
            // Hide after 6 seconds
            setTimeout(() => setMockNotification(null), 6000);
        }, 600);
    };

    const handleResend = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setTimer(30);
        setMockNotification(code);
        setTimeout(() => setMockNotification(null), 6000);
    };

    const handleVerifyOtp = () => {
        if (otp.length !== 6) {
            setError("Код должен содержать 6 цифр");
            return;
        }
        if (otp !== generatedCode) {
            setError("Неверный код");
            return;
        }
        onLoginSuccess(email);
    };

    return (
        <div className="flex flex-col min-h-screen p-6 justify-center max-w-md mx-auto w-full animate-fade-in relative">
            {/* Mock Notification Toast */}
            {mockNotification && (
                <div className="absolute top-4 left-4 right-4 bg-slate-800 border border-slate-600 p-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-5 fade-in duration-300">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-2 rounded-full text-primary"><Mail size={16} /></div>
                        <div>
                            <div className="font-bold text-sm text-white">Новое письмо (Demo)</div>
                            <div className="text-xs text-slate-300 mt-1">Код подтверждения ApexFit: <span className="font-mono font-bold text-white text-base tracking-widest">{mockNotification}</span></div>
                        </div>
                        <button onClick={() => setMockNotification(null)} className="ml-auto text-slate-400 hover:text-white"><X size={16} /></button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-center gap-3 mb-12">
                <Flame className="w-10 h-10 text-primary" />
                <h1 className="text-3xl font-bold tracking-tighter">ApexFit</h1>
            </div>

            <div className="bg-surface border border-slate-700 rounded-3xl p-6 shadow-2xl">
                {!showOtp ? (
                    <>
                         <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 hover:bg-slate-200 transition-colors">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                            Продолжить с Google
                        </button>
                         <button className="w-full bg-black text-white border border-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-6 hover:bg-slate-900 transition-colors">
                            <img src="https://www.svgrepo.com/show/511330/apple-173.svg" className="w-5 h-5 invert" alt="A" />
                            Продолжить с Apple
                        </button>

                        <div className="relative flex py-2 items-center mb-6">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">или с email</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted uppercase font-bold ml-1 mb-1 block">Email</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            {error && <div className="text-red-400 text-xs px-1">{error}</div>}
                            <button 
                                onClick={handleSendCode}
                                className="w-full bg-primary text-slate-900 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                disabled={!email}
                            >
                                Отправить код
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                         <h2 className="text-xl font-bold text-center">Введите код</h2>
                         <p className="text-center text-sm text-muted mb-4">Мы отправили 6-значный код на {email}</p>
                         <input 
                            type="text" 
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono text-white outline-none focus:border-primary transition-colors"
                            placeholder="000000"
                        />
                        {error && <div className="text-red-400 text-center text-xs">{error}</div>}
                        <button 
                            onClick={handleVerifyOtp}
                            className="w-full bg-primary text-slate-900 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors"
                        >
                            Подтвердить
                        </button>
                        <div className="text-center">
                            {timer > 0 ? (
                                <span className="text-xs text-muted">Повторная отправка через {timer} сек</span>
                            ) : (
                                <button onClick={handleResend} className="text-xs text-primary font-bold">Отправить повторно</button>
                            )}
                        </div>
                         <button onClick={() => setShowOtp(false)} className="w-full text-xs text-muted mt-2">Назад</button>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Продолжая, вы соглашаетесь с <button onClick={() => onViewLegal('tos')} className="text-slate-400 underline">Условиями использования</button> и <button onClick={() => onViewLegal('privacy')} className="text-slate-400 underline">Политикой конфиденциальности</button>
            </div>
        </div>
    );
}

const OnboardingWizard = ({ email, initialProfile, onComplete, onCancel }: { email: string, initialProfile?: UserProfile | null, onComplete: (profile: UserProfile) => void, onCancel?: () => void }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 4;
    const isEditing = !!initialProfile;
    
    // Form State
    const [avatar, setAvatar] = useState<string | null>(initialProfile?.avatar_url || null);
    const [name, setName] = useState(initialProfile?.name || "");
    const [surname, setSurname] = useState(initialProfile?.surname || "");
    const [dob, setDob] = useState(initialProfile?.dob || "");
    const [gender, setGender] = useState<'male'|'female'>(initialProfile?.gender || 'male');
    
    const [units, setUnits] = useState<{weight: 'kg'|'lbs', height: 'cm'|'ft_in'}>(initialProfile?.units || {weight: 'kg', height: 'cm'});
    const [height, setHeight] = useState(initialProfile?.height || 175);
    const [weight, setWeight] = useState(initialProfile?.weight || 75);
    
    const [level, setLevel] = useState<'beginner'|'intermediate'|'advanced'|'expert'>(initialProfile?.fitness_level || 'beginner');
    const [goals, setGoals] = useState<string[]>(initialProfile?.goals || []);
    
    const [mode, setMode] = useState<'simple'|'advanced'>(initialProfile?.tracking_mode || 'simple');
    const [dobError, setDobError] = useState("");

    const progress = (step / totalSteps) * 100;

    // Load draft from local storage on mount (only if not editing)
    useEffect(() => {
        if (isEditing) return;
        
        const draft = localStorage.getItem('apexfit_onboarding_draft');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                if (data.name) setName(data.name);
                if (data.surname) setSurname(data.surname);
                if (data.dob) setDob(data.dob);
                if (data.gender) setGender(data.gender);
                if (data.avatar) setAvatar(data.avatar);
                // We can load other fields too if we want full persistence across refresh
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, [isEditing]);

    // Save draft on change (Partial persistence for profile, only if not editing)
    useEffect(() => {
        if (isEditing) return;
        const data = { name, surname, dob, gender, avatar };
        localStorage.setItem('apexfit_onboarding_draft', JSON.stringify(data));
    }, [name, surname, dob, gender, avatar, isEditing]);


    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setAvatar(url);
        }
    };

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const selectedDate = new Date(val);
        const today = new Date();
        
        if (selectedDate > today) {
            setDobError("Пожалуйста, введите реальную дату");
        } else {
            setDobError("");
        }
        setDob(val);
    };

    const handleFinish = () => {
        if (!isEditing) {
            localStorage.removeItem('apexfit_onboarding_draft'); // Clear draft
        }
        const profile: UserProfile = {
            id: initialProfile?.id || crypto.randomUUID(),
            email: initialProfile?.email || email,
            name,
            surname,
            dob,
            gender,
            units,
            height,
            weight,
            fitness_level: level,
            goals,
            tracking_mode: mode,
            created_at: initialProfile?.created_at || Date.now(),
            updated_at: Date.now(),
            avatar_url: avatar || undefined
        };
        onComplete(profile);
    };

    const GoalsList = [
        { id: 'weight_loss', label: 'Похудение' },
        { id: 'muscle_gain', label: 'Набор мышц' },
        { id: 'strength', label: 'Увеличить силу' },
        { id: 'health', label: 'Улучшить здоровье' },
        { id: 'recomp', label: 'Рекомпозиция тела' },
        { id: 'endurance', label: 'Повысить выносливость' }
    ];

    if (isEditing) {
        return (
            <div className="min-h-screen bg-background p-4 animate-fade-in pb-20 overflow-y-auto">
                {/* Header with Cancel */}
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur z-10 py-3 border-b border-white/5 -mx-4 px-4">
                    <button onClick={onCancel} className="text-muted hover:text-white flex items-center gap-1 transition-colors">
                        <X size={20} /> <span className="text-sm font-medium">Отмена</span>
                    </button>
                    <h1 className="text-lg font-bold">Редактирование</h1>
                    <button onClick={handleFinish} className="text-primary font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">Готово</button>
                </div>
                
                <div className="space-y-8">
                    {/* Avatar Section */}
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="w-28 h-28 bg-slate-800 rounded-full flex items-center justify-center relative border-4 border-slate-700 overflow-hidden shadow-2xl">
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-12 h-12 text-muted" />
                                )}
                            </div>
                            <label htmlFor="avatar-upload-edit" className="absolute bottom-0 right-0 bg-primary hover:bg-emerald-400 text-slate-900 p-2 rounded-full border-4 border-background cursor-pointer transition-colors shadow-lg">
                                <Edit3 className="w-4 h-4" />
                            </label>
                            <input id="avatar-upload-edit" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">Личные данные</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary placeholder:text-muted/50 text-white" />
                            <input type="text" placeholder="Фамилия" value={surname} onChange={e => setSurname(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary placeholder:text-muted/50 text-white" />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted uppercase font-bold ml-1 mb-1 block">Дата рождения</label>
                            <input type="date" value={dob} onChange={handleDobChange} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary text-white" />
                            {dobError && <div className="text-red-400 text-xs px-1 mt-1">{dobError}</div>}
                        </div>
                        <div className="flex gap-4 p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                            <button onClick={() => setGender('male')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${gender === 'male' ? 'bg-slate-700 text-white shadow' : 'text-muted hover:text-white'}`}>Мужчина</button>
                            <button onClick={() => setGender('female')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${gender === 'female' ? 'bg-slate-700 text-white shadow' : 'text-muted hover:text-white'}`}>Женщина</button>
                        </div>
                    </div>

                    {/* Body Stats */}
                    <div className="space-y-4">
                         <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">Параметры тела</h3>
                         <div className="bg-surface p-4 rounded-xl border border-slate-700 space-y-6">
                            <div>
                                <div className="flex bg-slate-900 rounded-lg p-1 mb-3 border border-slate-800">
                                    <button onClick={() => setUnits({...units, weight: 'kg'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.weight === 'kg' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>KG</button>
                                    <button onClick={() => setUnits({...units, weight: 'lbs'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.weight === 'lbs' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>LBS</button>
                                </div>
                                <NumberInputControl label={`ВЕС (${units.weight.toUpperCase()})`} value={weight} onChange={setWeight} />
                            </div>
                            <div>
                                <div className="flex bg-slate-900 rounded-lg p-1 mb-3 border border-slate-800">
                                    <button onClick={() => setUnits({...units, height: 'cm'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.height === 'cm' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>CM</button>
                                    <button onClick={() => setUnits({...units, height: 'ft_in'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.height === 'ft_in' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>FT</button>
                                </div>
                                <NumberInputControl label={`РОСТ (${units.height.toUpperCase()})`} value={height} onChange={setHeight} />
                            </div>
                         </div>
                    </div>

                    {/* Goals & Level */}
                    <div className="space-y-4">
                         <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">Фитнес профиль</h3>
                         <div className="space-y-3">
                            <label className="text-[10px] text-muted uppercase font-bold ml-1">Уровень</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['beginner', 'intermediate', 'advanced', 'expert'].map((l) => (
                                    <button key={l} onClick={() => setLevel(l as any)} className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${level === l ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-slate-700 text-muted'}`}>
                                        {l === 'beginner' && 'Новичок'}
                                        {l === 'intermediate' && 'Средний'}
                                        {l === 'advanced' && 'Продвинутый'}
                                        {l === 'expert' && 'Эксперт'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] text-muted uppercase font-bold ml-1">Цели</label>
                            <div className="grid grid-cols-2 gap-2">
                                {GoalsList.map(g => (
                                    <button key={g.id} onClick={() => {
                                        if (goals.includes(g.id)) setGoals(goals.filter(id => id !== g.id));
                                        else setGoals([...goals, g.id]);
                                    }} className={`p-3 rounded-xl border text-xs font-bold transition-all ${goals.includes(g.id) ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-surface border-slate-700 text-muted'}`}>
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                     {/* Mode */}
                    <div className="space-y-4">
                         <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">Интерфейс</h3>
                         <div className="flex gap-4">
                            <button onClick={() => setMode('simple')} className={`flex-1 p-4 rounded-xl border transition-all ${mode === 'simple' ? 'bg-slate-800 border-white/20 text-white' : 'bg-surface border-slate-700 text-muted opacity-60'}`}>
                                <div className="font-bold text-sm mb-1">Простой</div>
                                <div className="text-[10px] opacity-70">Только выполнение</div>
                            </button>
                            <button onClick={() => setMode('advanced')} className={`flex-1 p-4 rounded-xl border transition-all ${mode === 'advanced' ? 'bg-slate-800 border-primary/50 text-primary ring-1 ring-primary/20' : 'bg-surface border-slate-700 text-muted opacity-60'}`}>
                                <div className="font-bold text-sm mb-1">Продвинутый</div>
                                <div className="text-[10px] opacity-70">Подходы, веса, повторы</div>
                            </button>
                         </div>
                    </div>
                    
                    <div className="pt-4 pb-8">
                         <button onClick={handleFinish} className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-400 transition-colors">Сохранить изменения</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col max-w-md mx-auto w-full p-4 animate-fade-in">
             <div className="w-full h-1 bg-slate-800 rounded-full mb-6 mt-2">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold mb-2">Давайте настроим ваш профиль</h2>
                            <p className="text-muted text-sm">Расскажите немного о себе</p>
                        </div>
                        
                        {/* Avatar Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center relative border-2 border-slate-700 overflow-hidden">
                                    {avatar ? (
                                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-10 h-10 text-muted" />
                                    )}
                                </div>
                                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary hover:bg-emerald-400 text-slate-900 p-1.5 rounded-full border-2 border-background cursor-pointer transition-colors shadow-lg">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </label>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary placeholder:text-muted/50" />
                            <input type="text" placeholder="Фамилия" value={surname} onChange={e => setSurname(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary placeholder:text-muted/50" />
                            <div>
                                <label className="text-[10px] text-muted uppercase font-bold ml-1 mb-1 block">Дата рождения</label>
                                <input type="date" value={dob} onChange={handleDobChange} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-primary text-white" />
                                {dobError && <div className="text-red-400 text-xs px-1 mt-1">{dobError}</div>}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setGender('male')} className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${gender === 'male' ? 'bg-emerald-900/30 border-emerald-500/50 text-primary' : 'bg-surface border-slate-700 text-muted'}`}>Мужчина</button>
                                <button onClick={() => setGender('female')} className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${gender === 'female' ? 'bg-emerald-900/30 border-emerald-500/50 text-primary' : 'bg-surface border-slate-700 text-muted'}`}>Женщина</button>
                            </div>
                        </div>
                         <button disabled={!name || !surname || !dob || !!dobError} onClick={() => setStep(2)} className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl mt-8 disabled:opacity-50">Продолжить</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8">
                         <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold mb-2">Физические параметры</h2>
                            <p className="text-muted text-sm">Выберите единицы измерения и введите параметры</p>
                        </div>
                        
                        <div className="bg-surface p-6 rounded-2xl border border-slate-700 space-y-6 shadow-xl">
                            {/* Weight Section */}
                            <div>
                                <div className="flex bg-slate-900 rounded-lg p-1 mb-3 border border-slate-800">
                                    <button onClick={() => setUnits({...units, weight: 'kg'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.weight === 'kg' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>KG</button>
                                    <button onClick={() => setUnits({...units, weight: 'lbs'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.weight === 'lbs' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>LBS</button>
                                </div>
                                <NumberInputControl label={`ВЕС (${units.weight.toUpperCase()})`} value={weight} onChange={setWeight} />
                            </div>

                             {/* Height Section */}
                            <div>
                                <div className="flex bg-slate-900 rounded-lg p-1 mb-3 border border-slate-800">
                                    <button onClick={() => setUnits({...units, height: 'cm'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.height === 'cm' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>CM</button>
                                    <button onClick={() => setUnits({...units, height: 'ft_in'})} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition-all ${units.height === 'ft_in' ? 'bg-slate-700 text-white shadow-sm' : 'text-muted hover:text-white'}`}>FT</button>
                                </div>
                                <NumberInputControl label={`РОСТ (${units.height.toUpperCase()})`} value={height} onChange={setHeight} />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setStep(1)} className="flex-1 bg-surface text-white font-bold py-4 rounded-xl">Назад</button>
                            <button onClick={() => setStep(3)} className="flex-[2] bg-primary text-slate-900 font-bold py-4 rounded-xl">Продолжить</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                     <div className="space-y-6 animate-in slide-in-from-right-8">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold mb-2">Ваши цели</h2>
                            <p className="text-muted text-sm">Это поможет персонализировать ваш опыт</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs text-muted uppercase font-bold ml-1">Уровень подготовки</label>
                            <div className="grid grid-cols-1 gap-2">
                                {['beginner', 'intermediate', 'advanced', 'expert'].map((l) => (
                                    <button key={l} onClick={() => setLevel(l as any)} className={`p-3 rounded-xl border text-left text-sm transition-all ${level === l ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-slate-700 text-slate-300'}`}>
                                        {l === 'beginner' && 'Новичок — новый в фитнесе'}
                                        {l === 'intermediate' && 'Средний — 6–12 месяцев'}
                                        {l === 'advanced' && 'Продвинутый — 2–5 лет'}
                                        {l === 'expert' && 'Эксперт — 5+ лет'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs text-muted uppercase font-bold ml-1">Цели</label>
                            <div className="grid grid-cols-2 gap-2">
                                {GoalsList.map(g => (
                                    <button key={g.id} onClick={() => {
                                        if (goals.includes(g.id)) setGoals(goals.filter(id => id !== g.id));
                                        else setGoals([...goals, g.id]);
                                    }} className={`p-3 rounded-xl border text-xs font-bold transition-all ${goals.includes(g.id) ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-surface border-slate-700 text-muted'}`}>
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setStep(2)} className="flex-1 bg-surface text-white font-bold py-4 rounded-xl">Назад</button>
                            <button disabled={goals.length === 0} onClick={() => setStep(4)} className="flex-[2] bg-primary text-slate-900 font-bold py-4 rounded-xl disabled:opacity-50">Продолжить</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8">
                         <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-2">Вам нравится вести учёт?</h2>
                            <p className="text-muted text-sm">Выберите удобный интерфейс</p>
                        </div>

                        <div className="space-y-4">
                            {/* Simple Mode */}
                            <button onClick={() => setMode('simple')} className={`w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${mode === 'simple' ? 'bg-slate-800 border-slate-600 ring-1 ring-slate-500' : 'bg-surface border-slate-700 opacity-60 hover:opacity-100'}`}>
                                <div className="relative z-10">
                                    <div className="font-bold text-lg text-white mb-1">Простой</div>
                                    <p className="text-xs text-muted leading-relaxed max-w-[90%] mb-4">Отмечайте выполнение без подробного логирования, минимум усилий.</p>
                                    
                                    {/* Simple Mode Visual Placeholder */}
                                    <div className="h-12 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center opacity-50">
                                        <div className="w-1/2 h-2 bg-slate-600 rounded-full"></div>
                                    </div>
                                </div>
                            </button>

                            {/* Advanced Mode - Updated Visuals */}
                            <button onClick={() => setMode('advanced')} className={`w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${mode === 'advanced' ? 'bg-emerald-900/20 border-emerald-500/50 ring-1 ring-emerald-500' : 'bg-surface border-slate-700 opacity-60 hover:opacity-100'}`}>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex-1">
                                        <div className={`font-bold text-lg mb-1 transition-colors ${mode === 'advanced' ? 'text-primary' : 'text-white'}`}>Продвинутый</div>
                                        <p className="text-xs text-muted leading-relaxed max-w-[90%]">Подходит для отслеживания прогресса: подходы, повторения и вес.</p>
                                    </div>
                                    {mode === 'advanced' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </div>
                                
                                {/* Skeleton UI Visual */}
                                <div className={`mt-4 p-3 rounded-lg border ${mode === 'advanced' ? 'bg-slate-900/50 border-emerald-500/20' : 'bg-slate-900/30 border-slate-700/50'}`}>
                                     <div className="flex gap-2 items-center mb-2">
                                        <div className="w-8 h-8 rounded bg-slate-800/80"></div>
                                        <div className="space-y-1.5">
                                            <div className="w-20 h-2 rounded bg-slate-800/80"></div>
                                            <div className="w-12 h-1.5 rounded bg-slate-800/60"></div>
                                        </div>
                                     </div>
                                     <div className="space-y-2">
                                         <div className="flex gap-2 items-center">
                                            <div className="w-6 h-6 rounded bg-slate-800/60 flex items-center justify-center text-[8px] text-slate-500">1</div>
                                            <div className="flex-1 h-6 rounded bg-slate-800/60 border border-slate-700 flex items-center px-2">
                                                <div className="w-full h-1 bg-slate-600 rounded"></div>
                                            </div>
                                         </div>
                                         <div className="flex gap-2 items-center">
                                            <div className="w-6 h-6 rounded bg-slate-800/60 flex items-center justify-center text-[8px] text-slate-500">2</div>
                                            <div className="flex-1 h-6 rounded bg-slate-800/60 border border-slate-700 flex items-center px-2">
                                                <div className="w-full h-1 bg-slate-600 rounded"></div>
                                            </div>
                                         </div>
                                     </div>
                                </div>
                            </button>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setStep(3)} className="flex-1 bg-surface text-white font-bold py-4 rounded-xl">Назад</button>
                            <button onClick={handleFinish} className="flex-[2] bg-primary text-slate-900 font-bold py-4 rounded-xl">Готово</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- MISSING COMPONENTS (Restored) ---

const WeeklyVolumeChart = () => {
    // Simulated data for Weekly Volume & Calories
    const data = [
        { name: 'Пн', volume: 4000, calories: 350 },
        { name: 'Вт', volume: 2400, calories: 280 },
        { name: 'Ср', volume: 0, calories: 0 },
        { name: 'Чт', volume: 5500, calories: 450 },
        { name: 'Пт', volume: 3200, calories: 310 },
        { name: 'Сб', volume: 6800, calories: 600 },
        { name: 'Вс', volume: 0, calories: 0 },
    ];

    return (
        <div className="h-40 w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={4}>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#f1f5f9' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} name="Объем (кг)" />
                    <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} name="Ккал" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const ProgressWidget = () => {
    const [selectedExerciseId, setSelectedExerciseId] = useState('bp_bb');
    
    // Convert DB options for dropdown
    const options = useMemo(() => EXERCISE_DB.map(e => ({ value: e.id, label: e.name })), []);

    // Generate mock progress data based on selection
    const data = useMemo(() => {
        // Just generating some random upward trend for demo purposes
        const base = selectedExerciseId === 'bp_bb' ? 80 : (selectedExerciseId === 'sq_bb' ? 100 : 40);
        return [
            { date: '10 янв', value: base },
            { date: '15 янв', value: base + 2.5 },
            { date: '20 янв', value: base + 5 },
            { date: '25 янв', value: base + 5 },
            { date: '30 янв', value: base + 7.5 },
            { date: '5 фев', value: base + 10 },
        ];
    }, [selectedExerciseId]);

    return (
        <div className="bg-surface p-4 rounded-2xl border border-slate-700 col-span-2">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-sm">Прогресс (1ПМ)</h3>
                </div>
                <SearchableDropdown 
                    options={options} 
                    value={selectedExerciseId} 
                    onChange={setSelectedExerciseId} 
                    placeholder="Упражнение"
                />
            </div>
            
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                        />
                         <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                         <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} hide />
                         <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] text-muted mt-2">10 янв. - 5 фев.</div>
        </div>
    );
};

const CalendarWidget = ({ selectedDate, onSelect, historyDates = [], scheduledDates = [] }: { selectedDate: Date, onSelect: (d: Date) => void, historyDates?: string[], scheduledDates?: string[] }) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    
    // Sync view if selectedDate changes significantly? Maybe not, user might want to browse.
    // Let's keep viewDate independent unless selectedDate changes externally widely, but usually simple state is enough.
    
    const monthName = viewDate.toLocaleString('ru-RU', { month: 'long' });
    const year = viewDate.getFullYear();

    const handlePrevMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() - 1);
        setViewDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + 1);
        setViewDate(d);
    };

    // Days generation
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0=Sun -> 6, 1=Mon -> 0
    };

    const daysInMonth = getDaysInMonth(year, viewDate.getMonth());
    const startOffset = getFirstDayOfMonth(year, viewDate.getMonth());

    const days = [];
    // Empty slots
    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} />);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const current = new Date(year, viewDate.getMonth(), i);
        const dKey = dateKey(current);
        const isSelected = current.toDateString() === selectedDate.toDateString();
        const isToday = current.toDateString() === new Date().toDateString();
        const isHistory = historyDates.includes(dKey);
        const isScheduled = scheduledDates.includes(dKey);
        
        let className = `h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all relative `;

        if (isSelected) {
            className += 'bg-primary text-slate-900 font-bold shadow-lg shadow-emerald-900/20';
        } else if (isHistory) {
            className += 'bg-emerald-900 text-emerald-100 border border-emerald-800'; // Dark green for past
        } else if (isScheduled) {
            className += 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'; // Light green for future
        } else if (isToday) {
            className += 'border border-primary text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]';
        } else {
            className += 'text-slate-300 hover:bg-slate-800';
        }

        days.push(
            <button 
                key={i} 
                onClick={() => onSelect(current)}
                className={className}
            >
                {i}
            </button>
        );
    }

    return (
        <div className="bg-surface p-4 rounded-3xl border border-slate-700/50 mb-6">
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex flex-col">
                    <span className="text-xl font-bold capitalize text-white">{monthName}</span>
                    <span className="text-xs text-muted font-medium">{year}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-700 rounded-full text-muted hover:text-white transition-colors"><ChevronLeft size={20} /></button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-700 rounded-full text-muted hover:text-white transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 mb-2 text-center">
                {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-muted uppercase tracking-wider">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                {days}
            </div>
        </div>
    );
}

const ActiveWorkout = ({ user, plan, initialData, onFinish, onCancel }: { user: UserProfile, plan: WorkoutPlanItem[] | undefined, initialData: SavedSessionState | null, onFinish: (duration: number, sessionData: ExerciseSessionData[]) => void, onCancel: () => void }) => {
  const [elapsed, setElapsed] = useState(initialData?.elapsedTime || 0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Initialize session data from plan or saved state
  const [sessionData, setSessionData] = useState<ExerciseSessionData[]>(() => {
     if (initialData?.sessionExercises) return initialData.sessionExercises;
     const p = plan || [];
     return p.map(item => {
         const def = EXERCISE_DB.find(e => e.id === item.exercise_id);
         if (!def) return null;
         return {
             def,
             sets: Array.from({length: item.target_sets}).map((_, i) => ({
                 id: crypto.randomUUID(),
                 workout_log_id: 'temp',
                 exercise_id: def.id,
                 set_order: i + 1,
                 weight_kg: item.target_weight,
                 reps: item.target_reps,
                 type: 'normal',
                 completed: false
             })),
             expanded: true
         };
     }).filter(Boolean) as ExerciseSessionData[];
  });

  // Effects for timers and persistence
  useEffect(() => {
      const t = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(t);
  }, []);

  useEffect(() => {
      let t: any;
      if (isResting) {
          t = setInterval(() => setRestTimer(r => r + 1), 1000);
      }
      return () => clearInterval(t);
  }, [isResting]);

  useEffect(() => {
      localStorage.setItem('apexfit_active_session', JSON.stringify({
          elapsedTime: elapsed,
          sessionExercises: sessionData,
          timestamp: Date.now()
      }));
  }, [elapsed, sessionData]);

  const toggleSet = (exIndex: number, setIndex: number) => {
      const newData = [...sessionData];
      const set = newData[exIndex].sets[setIndex];
      set.completed = !set.completed;
      
      if (set.completed) {
          setIsResting(true);
          setRestTimer(0);
      }
      setSessionData(newData);
  };

  const updateSet = (exIndex: number, setIndex: number, field: 'weight_kg' | 'reps', value: number) => {
      const newData = [...sessionData];
      const set = newData[exIndex].sets[setIndex];
      if (set.completed) return;
      set[field] = value;
      setSessionData(newData);
  };

  const addSet = (exIndex: number, type: 'normal' | 'warmup' = 'normal') => {
       const newData = [...sessionData];
       const currentSets = newData[exIndex].sets;
       
       let insertIndex = currentSets.length;
       if (type === 'warmup') {
           // Insert after last warmup or at start if no warmups
           // Standard: warmups first. Find first 'normal' set index.
           const firstNormalIdx = currentSets.findIndex(s => s.type !== 'warmup');
           insertIndex = firstNormalIdx === -1 ? currentSets.length : firstNormalIdx;
       }

       const prev = insertIndex > 0 ? currentSets[insertIndex - 1] : (currentSets.length > 0 ? currentSets[currentSets.length-1] : null);
       
       currentSets.splice(insertIndex, 0, {
           id: crypto.randomUUID(),
           workout_log_id: 'temp',
           exercise_id: newData[exIndex].def.id,
           set_order: insertIndex + 1,
           weight_kg: prev ? prev.weight_kg : 20,
           reps: prev ? prev.reps : 10,
           type: type,
           completed: false
       });
       
       setSessionData(newData);
  };

  const toggleExpand = (exIndex: number) => {
      const newData = [...sessionData];
      newData[exIndex].expanded = !newData[exIndex].expanded;
      setSessionData(newData);
  };

  return (
      <div className="flex flex-col h-screen bg-slate-950">
          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-surface border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                      <h3 className="text-xl font-bold text-white mb-2">Отменить тренировку?</h3>
                      <p className="text-muted text-sm mb-6">Прогресс не будет сохранен. Вы сможете начать тренировку заново.</p>
                      <div className="flex gap-3">
                          <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors">Нет</button>
                          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg">Да, отменить</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Header with Cancel Button */}
          <div className="flex justify-end px-4 pt-4 pb-0">
               <button onClick={() => setShowCancelConfirm(true)} className="px-4 py-2 bg-slate-800/80 rounded-full text-xs font-bold text-slate-400 hover:text-white border border-slate-700 hover:bg-red-500/20 hover:text-red-500 transition-colors">Отменить</button>
          </div>

          {/* Top Timers */}
          <div className="grid grid-cols-2 gap-4 px-4 pb-4 pt-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center">
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Время</div>
                  <div className="text-2xl font-mono font-bold text-white">{formatTime(elapsed)}</div>
              </div>
              <div className="bg-slate-900 border border-red-900/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Отдых</div>
                  <div className="text-2xl font-mono font-bold text-red-400">{formatTime(restTimer)}</div>
                  <div className="absolute bottom-0 left-0 h-1 bg-red-500/20 w-full"></div> 
              </div>
          </div>

          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
              Выберите упражнение
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
              {sessionData.map((exData, exIdx) => (
                  <div key={exData.def.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <button onClick={() => toggleExpand(exIdx)} className="w-full p-4 flex items-center justify-between bg-slate-800/50">
                          <div className="text-left">
                              <div className="font-bold text-white text-lg">{exData.def.name}</div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{exData.def.target_muscle_group}</div>
                          </div>
                          {exData.expanded ? <ChevronUp className="text-muted" size={20} /> : <ChevronDown className="text-muted" size={20} />}
                      </button>
                      
                      {exData.expanded && (
                          <div className="p-2 space-y-2">
                              {/* Add Warmup Button at Top */}
                              <button onClick={() => addSet(exIdx, 'warmup')} className="w-full py-2 text-center text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors flex items-center justify-center gap-1 border-b border-slate-800/50 mb-2">
                                  <Plus size={14} /> Добавить разминочные подходы
                              </button>
                              
                              <div className="space-y-2">
                                  {exData.sets.map((set, setIdx) => (
                                      <div key={set.id} className={`grid grid-cols-[24px_1fr_1fr_40px] gap-3 items-center p-2 rounded-xl border ${set.type === 'warmup' ? 'bg-yellow-900/10 border-yellow-700/30' : 'bg-slate-950/50 border-slate-800/50'}`}>
                                          <div className="flex items-center justify-center relative group">
                                              <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${set.type === 'warmup' ? 'text-yellow-500 bg-yellow-900/20' : 'text-slate-500 bg-slate-800'}`}>{setIdx + 1}</span>
                                          </div>
                                          
                                          {/* Weight Input */}
                                          <div className={`bg-slate-900 rounded-lg border border-slate-700 flex relative overflow-hidden h-12 ${set.completed ? 'opacity-50 pointer-events-none' : ''}`}>
                                              <div className="flex-1 flex flex-col justify-center px-2">
                                                  <span className="text-[8px] font-bold text-slate-500 uppercase">Вес</span>
                                                  <input 
                                                      type="number" 
                                                      value={set.weight_kg} 
                                                      onChange={(e) => updateSet(exIdx, setIdx, 'weight_kg', Number(e.target.value))}
                                                      className="bg-transparent text-white font-mono font-bold text-lg outline-none w-full"
                                                  />
                                              </div>
                                              <div className="w-8 flex flex-col border-l border-slate-700">
                                                  <button onClick={() => updateSet(exIdx, setIdx, 'weight_kg', set.weight_kg + 1)} className="flex-1 flex items-center justify-center hover:bg-slate-800 text-slate-400"><ChevronUp size={12} /></button>
                                                  <button onClick={() => updateSet(exIdx, setIdx, 'weight_kg', Math.max(0, set.weight_kg - 1))} className="flex-1 flex items-center justify-center hover:bg-slate-800 text-slate-400"><ChevronDown size={12} /></button>
                                              </div>
                                          </div>

                                          {/* Reps Input */}
                                          <div className={`bg-slate-900 rounded-lg border border-slate-700 flex relative overflow-hidden h-12 ${set.completed ? 'opacity-50 pointer-events-none' : ''}`}>
                                              <div className="flex-1 flex flex-col justify-center px-2">
                                                  <span className="text-[8px] font-bold text-slate-500 uppercase">Повт</span>
                                                  <input 
                                                      type="number" 
                                                      value={set.reps} 
                                                      onChange={(e) => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                                                      className="bg-transparent text-white font-mono font-bold text-lg outline-none w-full"
                                                  />
                                              </div>
                                              <div className="w-8 flex flex-col border-l border-slate-700">
                                                  <button onClick={() => updateSet(exIdx, setIdx, 'reps', set.reps + 1)} className="flex-1 flex items-center justify-center hover:bg-slate-800 text-slate-400"><ChevronUp size={12} /></button>
                                                  <button onClick={() => updateSet(exIdx, setIdx, 'reps', Math.max(0, set.reps - 1))} className="flex-1 flex items-center justify-center hover:bg-slate-800 text-slate-400"><ChevronDown size={12} /></button>
                                              </div>
                                          </div>

                                          {/* Checkbox */}
                                          <button 
                                              onClick={() => toggleSet(exIdx, setIdx)}
                                              className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${set.completed ? 'bg-emerald-500 text-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-500'}`}
                                          >
                                              <Check size={20} strokeWidth={3} />
                                          </button>
                                      </div>
                                  ))}
                              </div>

                              {/* Add Normal Set Button at Bottom */}
                               <button onClick={() => addSet(exIdx, 'normal')} className="w-full py-3 mt-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center transition-colors">
                                  <Plus size={16} className="mr-2" /> Добавить подход
                              </button>
                          </div>
                      )}
                  </div>
              ))}
              
              <button 
                onClick={() => onFinish(elapsed, sessionData)} 
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors shadow-lg mt-8 mb-8"
              >
                Завершить тренировку
              </button>
          </div>
      </div>
  );
};

const ProfileView = ({ user, onEdit, onLogout }: { user: UserProfile, onEdit: () => void, onLogout: () => void }) => {
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Format DOB
    const formattedDob = useMemo(() => {
        if (!user.dob) return '-';
        try {
            const date = new Date(user.dob);
            return date.toLocaleDateString('ru-RU');
        } catch (e) {
            return user.dob;
        }
    }, [user.dob]);

    // Handle outside click for settings menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="pb-24 animate-fade-in relative min-h-screen px-4 pt-6">
            {/* 1. Top Panel */}
            <div className="flex justify-between items-center mb-6 relative z-30">
                <h1 className="text-2xl font-bold text-white tracking-tight">Профиль</h1>
                <div className="relative" ref={settingsRef}>
                    <button 
                        onClick={() => setShowSettings(!showSettings)} 
                        className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                    
                    {/* Settings Dropdown */}
                    {showSettings && (
                        <div className="absolute top-10 right-0 bg-surface border border-slate-700 rounded-xl shadow-2xl w-56 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="py-1">
                                <button onClick={() => { setShowSettings(false); onEdit(); }} className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-200 transition-colors">
                                    <Edit3 size={16} /> Редактировать профиль
                                </button>
                                <div className="border-t border-slate-700 my-1"></div>
                                <button onClick={() => { setShowSettings(false); onLogout(); }} className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center gap-3 text-sm text-red-400 transition-colors">
                                    <LogOut size={16} /> Выйти
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Main Profile Card */}
            <div className="bg-surface border border-slate-700 rounded-3xl p-8 mb-4 flex flex-col items-center shadow-lg relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"></div>
                
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-slate-700 to-slate-600 mb-4 relative z-10">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border-4 border-surface relative flex items-center justify-center">
                         {user.avatar_url ? (
                            <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                         ) : (
                            <span className="text-3xl font-bold text-slate-500">{user.name[0]}</span>
                         )}
                    </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2 text-center relative z-10">{user.name} {user.surname}</h2>
                <div className="px-3 py-1 bg-slate-900/50 rounded-full border border-slate-700 text-xs font-bold text-primary uppercase tracking-wider relative z-10">
                    {user.fitness_level === 'beginner' && 'Новичок'}
                    {user.fitness_level === 'intermediate' && 'Средний'}
                    {user.fitness_level === 'advanced' && 'Продвинутый'}
                    {user.fitness_level === 'expert' && 'Эксперт'}
                </div>
            </div>

            {/* 3. Parameters Block (Rows) */}
            <div className="space-y-3">
                {/* Weight */}
                <div className="bg-surface border border-slate-700 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                    <span className="text-muted text-sm font-medium">Вес</span>
                    <span className="text-white font-bold text-lg tracking-tight">{user.weight} <span className="text-sm text-slate-500 font-medium">{user.units.weight}</span></span>
                </div>
                {/* Height */}
                <div className="bg-surface border border-slate-700 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                    <span className="text-muted text-sm font-medium">Рост</span>
                    <span className="text-white font-bold text-lg tracking-tight">{user.height} <span className="text-sm text-slate-500 font-medium">{user.units.height === 'ft_in' ? 'ft' : 'cm'}</span></span>
                </div>
                {/* DOB */}
                <div className="bg-surface border border-slate-700 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                    <span className="text-muted text-sm font-medium">Дата рождения</span>
                    <span className="text-white font-bold text-lg tracking-tight">{formattedDob}</span>
                </div>
            </div>
        </div>
    )
}

const WorkoutDetailsView = ({ log, onClose, allSets, user }: { log: WorkoutLog, onClose: () => void, allSets: WorkoutSet[], user: UserProfile }) => {
  // Filter sets for this log
  const logSets = allSets.filter(s => s.workout_log_id === log.id);
  
  // Group by exercise
  const exercisesInLog = useMemo(() => {
    const groups: Record<string, WorkoutSet[]> = {};
    logSets.forEach(s => {
      if (!groups[s.exercise_id]) groups[s.exercise_id] = [];
      groups[s.exercise_id].push(s);
    });
    return groups;
  }, [logSets]);

  // Calculate Metrics
  const volume = logSets.reduce((acc, s) => acc + (s.weight_kg * s.reps), 0);
  
  // Avg METs
  const uniqueExerciseIds = Object.keys(exercisesInLog);
  const exerciseDefs = uniqueExerciseIds.map(id => EXERCISE_DB.find(e => e.id === id)).filter(Boolean) as Exercise[];
  const avgMets = calculateAverageMets(exerciseDefs);
  
  const calories = calculateApexFitCalories({
      userWeightKg: user.weight, 
      durationSec: log.duration_sec,
      avgMetValue: avgMets,
      activityType: 'Strength'
  });

  return (
    <div className="h-full bg-background animate-fade-in pb-20 overflow-y-auto">
      <button onClick={onClose} className="flex items-center text-primary mb-6"><ArrowLeft className="w-5 h-5 mr-2" /> Назад</button>
      
      <h1 className="text-2xl font-bold mb-1">{log.name || 'Тренировка'}</h1>
      <p className="text-muted text-xs mb-6">{new Date(log.start_time).toLocaleString()}</p>
      
      {/* Stats Grid */}
      <div className="bg-surface p-4 rounded-xl border border-slate-700 mb-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2">
                <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Длительность</div>
                <div className="font-mono text-xl font-bold text-white">{formatTime(log.duration_sec)}</div>
            </div>
             <div className="text-center p-2 border-l border-slate-700">
                <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Оценка</div>
                <div className="font-mono text-xl font-bold text-white">{log.feeling_rpe || '-'}/10</div>
            </div>
             <div className="text-center p-2 border-t border-slate-700">
                <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Объем</div>
                <div className="font-mono text-xl font-bold text-white">{volume.toLocaleString()} <span className="text-xs text-muted">кг</span></div>
            </div>
             <div className="text-center p-2 border-t border-l border-slate-700">
                <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Калории</div>
                <div className="font-mono text-xl font-bold text-white">{calories} <span className="text-xs text-muted">ккал</span></div>
            </div>
         </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider ml-1">Выполненные упражнения</h3>
          {uniqueExerciseIds.map(exId => {
              const def = EXERCISE_DB.find(e => e.id === exId);
              const sets = exercisesInLog[exId].sort((a,b) => a.set_order - b.set_order);
              if (!def) return null;

              return (
                  <div key={exId} className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
                      <div className="p-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                          <span className="font-bold text-white text-sm">{def.name}</span>
                          <span className="text-xs text-muted">{sets.length} подходов</span>
                      </div>
                      <div className="p-2 space-y-1">
                          {sets.map((set, idx) => (
                              <div key={idx} className={`grid grid-cols-[20px_1fr_1fr_1fr] text-xs py-2 px-2 rounded ${set.type === 'warmup' ? 'bg-yellow-500/10 text-yellow-200' : 'text-slate-300'}`}>
                                  <span className="font-mono opacity-50">{idx + 1}</span>
                                  <span className="font-bold">{set.weight_kg} кг</span>
                                  <span>{set.reps} повт</span>
                                  <span className="text-right opacity-70 text-[10px] uppercase tracking-wider">{set.type === 'warmup' ? 'Разминка' : 'Рабочий'}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )
          })}
          {uniqueExerciseIds.length === 0 && (
              <div className="text-center text-muted text-sm py-10">Нет данных об упражнениях</div>
          )}
      </div>
    </div>
  );
};

const DayPlanEditor = ({ date, onClose, onSave, currentPlan, currentName }: { date: Date, onClose: () => void, onSave: (d: Date, p: WorkoutPlanItem[], n: string) => void, currentPlan: WorkoutPlanItem[] | undefined, currentName: string | undefined }) => {
  const [name, setName] = useState(currentName || "");
  const [items, setItems] = useState<WorkoutPlanItem[]>(currentPlan || []);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  const filteredExercises = EXERCISE_DB.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddExercise = (exerciseId: string) => {
    setItems([...items, { exercise_id: exerciseId, target_sets: 3, target_reps: 10, target_weight: 0, target_rest_sec: 60 }]);
    setShowPicker(false);
    setSearch("");
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof WorkoutPlanItem, value: number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  return (
    <div className="h-full bg-background animate-fade-in pb-20 overflow-y-auto">
        {/* Exercise Picker Modal */}
        {showPicker && (
            <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col p-4">
                 <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setShowPicker(false)} className="p-2 bg-slate-800 rounded-full"><ArrowLeft size={20} /></button>
                    <div className="flex-1 bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-2">
                        <Search className="w-5 h-5 text-muted" />
                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск упражнения..." className="bg-transparent w-full outline-none text-white" />
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredExercises.map(ex => (
                        <button key={ex.id} onClick={() => handleAddExercise(ex.id)} className="w-full text-left bg-surface p-4 rounded-xl border border-slate-700 flex justify-between items-center active:bg-slate-700">
                             <div>
                                <div className="font-bold text-white">{ex.name}</div>
                                <div className="text-xs text-muted">{ex.target_muscle_group} • {ex.equipment_type}</div>
                             </div>
                             <Plus className="text-primary w-5 h-5" />
                        </button>
                    ))}
                 </div>
            </div>
        )}

        <div className="flex items-center mb-6">
            <button onClick={onClose} className="flex items-center text-muted hover:text-white"><ArrowLeft className="w-5 h-5 mr-2" /> Отмена</button>
        </div>
        <h1 className="text-2xl font-bold mb-6">План на {date.toLocaleDateString()}</h1>
        <div className="space-y-6">
             <div>
                <label className="text-xs text-muted uppercase font-bold ml-1 mb-1 block">Название тренировки</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Например: День ног" className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
             </div>

             <div className="space-y-3">
                 {items.map((item, idx) => {
                     const ex = EXERCISE_DB.find(e => e.id === item.exercise_id);
                     return (
                         <div key={idx} className="bg-surface p-4 rounded-xl border border-slate-700 relative group">
                             <button onClick={() => handleRemoveItem(idx)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                             <div className="font-bold text-white mb-4 pr-8 text-lg">{ex?.name}</div>
                             <div className="grid grid-cols-3 gap-4">
                                 <CompactNumberControl label="Подходы" value={item.target_sets} onChange={v => updateItem(idx, 'target_sets', v)} />
                                 <CompactNumberControl label="Повторы" value={item.target_reps} onChange={v => updateItem(idx, 'target_reps', v)} />
                                 <CompactNumberControl label="Вес (кг)" value={item.target_weight} onChange={v => updateItem(idx, 'target_weight', v)} />
                             </div>
                         </div>
                     );
                 })}
             </div>
             
             <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center">
                <p className="text-muted text-sm mb-4">Добавьте упражнения в план</p>
                <button onClick={() => setShowPicker(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors border border-slate-600">Добавить упражнение</button>
             </div>
             
             <button 
                onClick={() => onSave(date, items, name)}
                className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-400 transition-colors"
            >
                Сохранить план
            </button>
        </div>
    </div>
  );
};

const ExerciseLibraryView = ({ onSelect }: { onSelect: (ex: Exercise) => void }) => (
      <div className="pb-20 animate-fade-in">
        <h2 className="text-xl font-bold mb-4">Библиотека упражнений</h2>
        <div className="space-y-2">{EXERCISE_DB.map(ex => (
            <button key={ex.id} onClick={() => onSelect(ex)} className="w-full text-left bg-surface p-4 rounded-xl border border-slate-700 flex justify-between hover:border-primary transition-colors group">
                <span className="font-semibold group-hover:text-primary transition-colors">{ex.name}</span><ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
        ))}</div>
      </div>
);

const ExerciseDetailsView = ({ exercise, onClose }: { exercise: Exercise, onClose: () => void }) => {
    return (
        <div className="h-full bg-background animate-fade-in pb-20 overflow-y-auto">
             <button onClick={onClose} className="fixed top-4 left-4 z-10 bg-black/50 p-2 rounded-full text-white backdrop-blur-md"><ArrowLeft size={20} /></button>
             
             {exercise.image_url && (
                <div className="w-full aspect-video bg-slate-800 rounded-2xl mb-6 overflow-hidden border border-slate-700 shadow-lg relative group">
                   <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                   <div className="absolute bottom-4 left-4">
                        <div className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded backdrop-blur-md">{exercise.category}</div>
                   </div>
                </div>
             )}
        
             <h1 className="text-3xl font-bold mb-2">{exercise.name}</h1>
             
             <div className="flex flex-wrap gap-2 mb-6">
                <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-bold text-slate-300">{exercise.target_muscle_group}</div>
                <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-bold text-slate-300">{exercise.equipment_type}</div>
                <div className={`px-3 py-1 rounded-full border text-xs font-bold ${
                    exercise.difficulty === 'Beginner' ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 
                    exercise.difficulty === 'Intermediate' ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400' : 
                    'bg-red-900/30 border-red-500/30 text-red-400'
                }`}>{exercise.difficulty}</div>
             </div>
        
             <div className="space-y-6">
                <div>
                   <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Техника выполнения</h3>
                   <p className="text-slate-300 text-sm leading-relaxed bg-surface p-4 rounded-xl border border-slate-700">{exercise.description || 'Описание отсутствует.'}</p>
                </div>
        
                {exercise.tips && (
                   <div>
                       <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Советы</h3>
                       <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex gap-3">
                           <Info className="w-5 h-5 text-blue-400 shrink-0" />
                           <p className="text-blue-200/80 text-sm leading-relaxed">{exercise.tips}</p>
                       </div>
                   </div>
                )}
             </div>
        </div>
    );
};

const WorkoutSummary = ({ duration, sessionData, user, onSave }: { duration: number, sessionData: ExerciseSessionData[], user: UserProfile, onSave: (name: string, notes: string, rpe: number) => void }) => {
    const [name, setName] = useState(`Тренировка ${new Date().toLocaleDateString()}`);
    const [notes, setNotes] = useState("");
    const [rpe, setRpe] = useState(5);

    // Calculate stats
    const volume = sessionData.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => sAcc + (s.weight_kg * s.reps), 0), 0);
    const setsCompleted = sessionData.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    const avgMets = calculateAverageMets(sessionData.map(e => e.def));
    const calories = calculateApexFitCalories({
        userWeightKg: user.weight,
        durationSec: duration,
        avgMetValue: avgMets
    });

    return (
        <div className="min-h-screen bg-background p-6 animate-fade-in pb-20 overflow-y-auto">
             <div className="flex items-center justify-center mb-6">
                <CheckCircle2 className="w-16 h-16 text-primary mb-2" />
             </div>
             <h1 className="text-3xl font-bold text-center mb-2">Отличная работа!</h1>
             <p className="text-center text-muted mb-8">Тренировка завершена</p>

             <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-surface p-4 rounded-xl border border-slate-700 text-center">
                     <div className="text-xs text-muted uppercase font-bold mb-1">Время</div>
                     <div className="text-xl font-mono font-bold">{formatTime(duration)}</div>
                 </div>
                 <div className="bg-surface p-4 rounded-xl border border-slate-700 text-center">
                     <div className="text-xs text-muted uppercase font-bold mb-1">Калории</div>
                     <div className="text-xl font-mono font-bold">{calories}</div>
                 </div>
                 <div className="bg-surface p-4 rounded-xl border border-slate-700 text-center">
                     <div className="text-xs text-muted uppercase font-bold mb-1">Объем</div>
                     <div className="text-xl font-mono font-bold">{volume} <span className="text-xs text-slate-500">кг</span></div>
                 </div>
                 <div className="bg-surface p-4 rounded-xl border border-slate-700 text-center">
                     <div className="text-xs text-muted uppercase font-bold mb-1">Подходы</div>
                     <div className="text-xl font-mono font-bold">{setsCompleted}</div>
                 </div>
             </div>

             <div className="space-y-6">
                 <div>
                    <label className="text-xs text-muted uppercase font-bold ml-1 mb-1 block">Название</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                 </div>
                 
                 <div>
                    <label className="text-xs text-muted uppercase font-bold ml-1 mb-1 block">Оценка нагрузки (RPE): {rpe}/10</label>
                    <input type="range" min="1" max="10" step="1" value={rpe} onChange={e => setRpe(Number(e.target.value))} className="w-full accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-muted mt-1 px-1">
                        <span>Легко</span>
                        <span>Отказ</span>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs text-muted uppercase font-bold ml-1 mb-1 block">Заметки</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary resize-none" placeholder="Как самочувствие?" />
                 </div>

                 <button onClick={() => onSave(name, notes, rpe)} className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-400 transition-colors mt-4">
                    Сохранить в журнал
                 </button>
             </div>
        </div>
    );
};

const WorkoutHistoryView = ({ logs, onOpenLog }: { logs: WorkoutLog[], onOpenLog: (log: WorkoutLog) => void }) => {
    return (
        <div className="pb-20 animate-fade-in">
             <h2 className="text-xl font-bold mb-6">История тренировок</h2>
             {logs.length === 0 ? (
                 <div className="text-center py-20 text-muted">
                     <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
                     <p>История пуста</p>
                 </div>
             ) : (
                 <div className="space-y-4">
                     {logs.map(log => (
                         <button key={log.id} onClick={() => onOpenLog(log)} className="w-full bg-surface p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors text-left group">
                             <div className="flex justify-between items-start mb-2">
                                 <div>
                                     <div className="font-bold text-lg group-hover:text-primary transition-colors">{log.name || 'Без названия'}</div>
                                     <div className="text-xs text-muted">{new Date(log.start_time).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                 </div>
                                 <div className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-400">{formatTime(log.duration_sec)}</div>
                             </div>
                             <div className="flex items-center gap-4 text-xs text-slate-400">
                                 <span className="flex items-center gap-1"><Weight size={12} /> {log.feeling_rpe ? `${log.feeling_rpe}/10` : '-'}</span>
                                 {log.status === 'finished' && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={12} /> Завершено</span>}
                             </div>
                         </button>
                     ))}
                 </div>
             )}
        </div>
    );
};

// --- EXISTING COMPONENTS (Refactored to use UserProfile) ---

const Dashboard = ({ user, onStartWorkout, onDateSelect, scheduledDates, historyDates, workoutPlans, workoutName, onProfileClick }: { user: UserProfile, onStartWorkout: () => void, onDateSelect: (date: Date) => void, scheduledDates: string[], historyDates: string[], workoutPlans: Record<string, WorkoutPlanItem[]>, workoutName?: string, onProfileClick: () => void }) => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const today = new Date();
  const formattedDate = selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const planKey = dateKey(selectedDate);
  const dayPlan = workoutPlans[planKey] || [];
  const hasPlan = dayPlan.length > 0;
  const planName = workoutName || (hasPlan ? 'Пользовательская' : undefined);

  // Derived Metrics
  const bmr = useMemo(() => calculateBMR(user), [user]);
  const tdee = useMemo(() => calculateTDEE(user), [user]);
  const waterGoal = useMemo(() => calculateDailyWaterGoal(user), [user]);

  // Goal Text
  const goalLabel = useMemo(() => {
      if (user.goals.includes('weight_loss')) return 'Похудение';
      if (user.goals.includes('muscle_gain')) return 'Набор мышц';
      return 'Поддержание';
  }, [user.goals]);
  
  // Check if date is strictly in the past (before today 00:00)
  const isPast = useMemo(() => {
      const d = new Date(selectedDate);
      d.setHours(0,0,0,0);
      const t = new Date();
      t.setHours(0,0,0,0);
      return d < t;
  }, [selectedDate]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative">
      {/* Plan Modal (Updated Position) */}
      {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-surface border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button onClick={() => setShowPlanModal(false)} className="absolute top-4 right-4 text-muted hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                  <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-1">План на {selectedDate.getDate() === today.getDate() ? 'сегодня' : formattedDate}</h2>
                      <div className="flex items-center gap-2 text-primary font-medium text-sm"><Calendar className="w-4 h-4" /><span className="capitalize">{formattedDate}</span></div>
                  </div>
                  <div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600">
                      {hasPlan ? ( dayPlan.map((item, idx) => {
                          const ex = EXERCISE_DB.find(e => e.id === item.exercise_id);
                          return (
                              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-muted border border-slate-700">{idx + 1}</div>
                                  <div><div className="font-bold text-sm text-slate-200">{ex?.name}</div><div className="text-xs text-muted font-mono mt-0.5">{item.target_sets} x {item.target_reps} • {item.target_weight > 0 ? `${item.target_weight} кг` : 'Свой вес'}</div></div>
                              </div>
                          );
                      })) : (<div className="text-center text-muted py-8 text-sm">Нет запланированных упражнений.</div>)}
                  </div>
                  <button 
                      onClick={() => { setShowPlanModal(false); if (hasPlan) { onStartWorkout(); } else { if(!isPast) onDateSelect(selectedDate); }}} 
                      disabled={!hasPlan && isPast}
                      className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 
                        ${hasPlan ? 'bg-primary text-slate-900 hover:bg-emerald-400 shadow-emerald-900/20' : 
                          isPast ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                  >
                      {hasPlan ? (<><Play className="w-5 h-5 fill-current" />Погнали!</>) : 
                       isPast ? 'Нельзя создать' : (<><Plus className="w-5 h-5" />Создать план</>)}
                  </button>
              </div>
          </div>
      )}

      {/* HEADER: Centered Logo, Avatar Right - MODIFIED */}
      <div className="flex justify-between items-center py-2 relative">
         <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Flame className="text-primary w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">ApexFit</span>
         </div>
         <div className="flex-1"></div> {/* Left Spacer */}
         <button onClick={onProfileClick} className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-primary/50 relative hover:scale-105 transition-transform">
            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.name[0]}</div>}
         </button>
      </div>

      {/* GREETING & GOAL - ADDED BACK */}
      <div className="animate-in slide-in-from-left-4 fade-in duration-500">
          <h1 className="text-2xl font-bold text-text">Привет, {user.name}</h1>
          <p className="text-muted text-sm">Цель: <span className="text-primary">{goalLabel}</span></p>
      </div>

      {/* QUICK ACTION CARD - MOVED ABOVE CALENDAR (Like screenshot flow) */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-1 rounded-2xl shadow-lg shadow-emerald-900/20">
        <div className="bg-surface/50 backdrop-blur-sm p-5 rounded-xl border border-white/5">
          <div className="flex justify-between items-start mb-6">
            <div>
               <div className="text-xs text-muted uppercase tracking-wider mb-1">ДАЛЕЕ: <span className="text-slate-300 capitalize">{formattedDate}</span></div>
               {planName && <div className="font-bold text-lg text-white leading-tight">{planName}</div>}
               {!planName && <div className="text-muted text-sm italic">Отдых</div>}
            </div>
            <span className={`text-xs px-2 py-1 rounded border mt-1 ${hasPlan ? 'bg-black/40 text-primary border-primary/20' : 'bg-slate-800 text-muted border-slate-700'}`}>
                {hasPlan ? 'Запланировано' : 'Нет плана'}
            </span>
          </div>
          <button onClick={() => setShowPlanModal(true)} className="w-full bg-primary text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors">
            {hasPlan ? <Play className="w-5 h-5 fill-current" /> : <Plus className="w-5 h-5" />}
            {hasPlan ? 'Начать тренировку' : 'Создать тренировку'}
          </button>
        </div>
      </div>

       {/* MONTH CALENDAR WIDGET */}
       <CalendarWidget 
          selectedDate={selectedDate} 
          onSelect={(d) => { setSelectedDate(d); onDateSelect(d); }}
          historyDates={historyDates}
          scheduledDates={scheduledDates} 
        />

      {/* CHARTS - UPDATED TO MATCH SCREENSHOTS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-slate-700 col-span-2">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Недельный объем и Калории</h3>
            </div>
            <WeeklyVolumeChart />
        </div>
        <ProgressWidget />
      </div>
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // App Data State (Lifted from constants to support edits)
  const [logs, setLogs] = useState<WorkoutLog[]>(MOCK_LOGS);
  const [historySets, setHistorySets] = useState<WorkoutSet[]>(MOCK_HISTORY_SETS);

  // Other existing state
  const [workoutActive, setWorkoutActive] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [selectedPlanDate, setSelectedPlanDate] = useState<Date | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<Record<string, WorkoutPlanItem[]>>({});
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});
  const [pendingSession, setPendingSession] = useState<SavedSessionState | null>(null);
  const [activeSessionInitialData, setActiveSessionInitialData] = useState<SavedSessionState | null>(null);
  const [finishedSessionData, setFinishedSessionData] = useState<ExerciseSessionData[] | null>(null);
  const [tempEmail, setTempEmail] = useState("");
  const [finishedDuration, setFinishedDuration] = useState(0);

  // Computed dates for Calendar
  const historyDates = useMemo(() => logs.map(l => l.start_time.split('T')[0]), [logs]);
  const planDates = useMemo(() => Object.keys(workoutPlans), [workoutPlans]);

  useEffect(() => {
      // Check for user profile
      const storedProfile = localStorage.getItem('apexfit_user_profile');
      if (storedProfile) {
          setUserProfile(JSON.parse(storedProfile));
          setCurrentView('dashboard');
      }

      // Check for saved session
      try {
        const savedSession = localStorage.getItem('apexfit_active_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as SavedSessionState;
          const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;
          if (parsed.timestamp && (Date.now() - parsed.timestamp < MAX_SESSION_AGE_MS)) {
             setPendingSession(parsed);
          } else {
             localStorage.removeItem('apexfit_active_session');
          }
        }
      } catch (e) {
        localStorage.removeItem('apexfit_active_session');
      }
  }, []);

  const handleLoginSuccess = (email: string) => {
      setTempEmail(email);
      // Check if profile exists (mock)
      const storedProfile = localStorage.getItem('apexfit_user_profile');
      if (storedProfile) {
           const p = JSON.parse(storedProfile);
           if (p.email === email) {
               setUserProfile(p);
               setCurrentView('dashboard');
               return;
           }
      }
      setCurrentView('onboarding');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
      setUserProfile(profile);
      localStorage.setItem('apexfit_user_profile', JSON.stringify(profile));
      if (userProfile) { // Editing existing profile
          setCurrentView('profile');
      } else { // New profile
          setCurrentView('dashboard');
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('apexfit_user_profile');
      setUserProfile(null);
      setCurrentView('login');
  };

  const handleDateSelect = (date: Date) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const selected = new Date(date); selected.setHours(0,0,0,0);
    if (selected < today) {
       // Look for history
       const dateStr = dateKey(date);
       const log = logs.find(l => l.start_time.startsWith(dateStr));
       if (log) { setSelectedLog(log); setCurrentView('workout_details'); }
    } else {
       setSelectedPlanDate(date); setCurrentView('day_plan');
    }
  };

  const handleResumeSession = () => {
    if (pendingSession) {
        setActiveSessionInitialData(pendingSession);
        setWorkoutActive(true);
        setPendingSession(null);
    }
  };

  const handleDiscardSession = () => {
    localStorage.removeItem('apexfit_active_session');
    setPendingSession(null);
    setActiveSessionInitialData(null);
  };

  const handleFinishWorkout = (duration: number, sessionData: ExerciseSessionData[]) => {
      setWorkoutActive(false);
      setFinishedDuration(duration);
      setFinishedSessionData(sessionData);
      setActiveSessionInitialData(null);
      setPendingSession(null);
      localStorage.removeItem('apexfit_active_session');
      setCurrentView('workout_summary');
  };

  const handleCancelWorkout = () => {
      setWorkoutActive(false);
      setActiveSessionInitialData(null);
      setPendingSession(null);
      localStorage.removeItem('apexfit_active_session');
      setCurrentView('dashboard');
  };

  const handleSaveWorkout = (name: string, notes: string, rpe: number) => {
      if (!finishedSessionData) return;
      
      const newLogId = crypto.randomUUID();
      const newLog: WorkoutLog = {
          id: newLogId,
          user_id: userProfile?.id || 'guest',
          name: name,
          start_time: new Date().toISOString(),
          duration_sec: finishedDuration,
          feeling_rpe: rpe,
          notes: notes,
          status: 'finished',
          sync_status: 'pending'
      };
      
      const newSets: WorkoutSet[] = finishedSessionData.flatMap(ex => 
          ex.sets.filter(s => s.completed).map(s => ({
              ...s,
              id: crypto.randomUUID(),
              workout_log_id: newLogId,
              exercise_id: ex.def.id
          }))
      );

      setLogs([newLog, ...logs]);
      setHistorySets([...newSets, ...historySets]);
      setFinishedSessionData(null);
      setCurrentView('workout_logger');
  };

  // View Router
  const renderView = () => {
      if (currentView === 'login') return <LoginScreen onLoginSuccess={handleLoginSuccess} onViewLegal={(type) => setCurrentView(type === 'tos' ? 'legal_tos' : 'legal_privacy')} />;
      if (currentView === 'legal_tos') return <LegalText type="tos" onBack={() => setCurrentView('login')} />;
      if (currentView === 'legal_privacy') return <LegalText type="privacy" onBack={() => setCurrentView('login')} />;
      if (currentView === 'onboarding') return <OnboardingWizard 
          email={userProfile?.email || tempEmail} 
          initialProfile={userProfile || undefined} 
          onComplete={handleOnboardingComplete} 
          onCancel={userProfile ? () => setCurrentView('profile') : undefined}
      />;
      
      if (workoutActive && userProfile) {
          // Note: ActiveWorkout needs update to accept UserProfile, for now casting or adapting props
          return <ActiveWorkout user={userProfile as any} plan={workoutPlans[dateKey(new Date())]} initialData={activeSessionInitialData} onFinish={handleFinishWorkout} onCancel={handleCancelWorkout} />;
      }

      if (currentView === 'workout_summary' && finishedSessionData && userProfile) {
          return <WorkoutSummary duration={finishedDuration} sessionData={finishedSessionData} user={userProfile} onSave={handleSaveWorkout} />;
      }

      if (!userProfile) return null; // Should not happen

      switch(currentView) {
          case 'dashboard': return <Dashboard user={userProfile} onStartWorkout={() => { setActiveSessionInitialData(null); setWorkoutActive(true); }} onDateSelect={handleDateSelect} scheduledDates={planDates} historyDates={historyDates} workoutPlans={workoutPlans} workoutName={workoutNames[dateKey(new Date())]} onProfileClick={() => setCurrentView('profile')} />;
          case 'exercise_library': return selectedExercise ? <ExerciseDetailsView exercise={selectedExercise} onClose={() => setSelectedExercise(null)} /> : <ExerciseLibraryView onSelect={setSelectedExercise} />; // Assuming ExerciseLibraryView exists or refactored
          case 'workout_logger': return <WorkoutHistoryView logs={logs} onOpenLog={(log) => { setSelectedLog(log); setCurrentView('workout_details'); }} />;
          case 'workout_details': return selectedLog ? <WorkoutDetailsView log={selectedLog} allSets={historySets} user={userProfile} onClose={() => setCurrentView('workout_logger')} /> : null;
          case 'day_plan': return selectedPlanDate ? <DayPlanEditor date={selectedPlanDate} onClose={() => setCurrentView('dashboard')} onSave={(d, p, n) => { /* save logic */ const k = dateKey(d); setWorkoutPlans(prev => ({...prev, [k]: p})); setWorkoutNames(prev => ({...prev, [k]: n})); setCurrentView('dashboard'); }} currentPlan={workoutPlans[dateKey(selectedPlanDate)]} currentName={workoutNames[dateKey(selectedPlanDate)]} /> : null;
          case 'profile': return <ProfileView user={userProfile} onEdit={() => setCurrentView('onboarding')} onLogout={handleLogout} />;
          default: return null;
      }
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary selection:text-slate-900">
        
        {/* Session Recovery Modal */}
        {pendingSession && !workoutActive && currentView === 'dashboard' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-surface border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4 text-yellow-400"><AlertTriangle className="w-8 h-8" /><h2 className="text-xl font-bold text-white">Найдена тренировка</h2></div>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">Мы нашли незавершенную тренировку. Хотите продолжить?<br/><span className="text-xs text-muted mt-2 block">Время: {formatTime(pendingSession.elapsedTime)}</span></p>
                    <div className="flex gap-3">
                        <button onClick={handleDiscardSession} className="flex-1 py-3 rounded-xl bg-slate-800 text-muted hover:text-white font-bold transition-colors">Сбросить</button>
                        <button onClick={handleResumeSession} className="flex-1 py-3 rounded-xl bg-primary text-slate-900 font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20">Продолжить</button>
                    </div>
                </div>
            </div>
        )}

        {/* Header Removed from Global Layout for Dashboard (moved inside Dashboard), kept for other views if needed or simplified */}
        {/* We only show a simple header for non-dashboard views now if needed, or rely on back buttons */}
        
        <main className="container mx-auto px-4 py-6 max-w-md md:max-w-2xl min-h-screen">
            {renderView()}
        </main>

        {/* Nav */}
        {userProfile && !workoutActive && ['dashboard', 'workout_logger', 'exercise_library', 'profile'].includes(currentView) && (
            <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-white/5 pb-safe pt-2 px-6 z-50">
                <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 w-full">
                    <div className="flex justify-center"><NavBtn icon={<Activity />} label="Главная" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} /></div>
                    <div className="flex justify-center"><NavBtn icon={<ClipboardList />} label="Журнал" active={currentView === 'workout_logger'} onClick={() => setCurrentView('workout_logger')} /></div>
                    <div className="flex justify-center"><NavBtn icon={<Dumbbell />} label="Упражнения" active={currentView === 'exercise_library'} onClick={() => setCurrentView('exercise_library')} /></div>
                    <div className="flex justify-center"><NavBtn icon={<UserIcon />} label="Профиль" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} /></div>
                </div>
            </nav>
        )}
    </div>
  );
}

const NavBtn = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 w-12 transition-colors duration-300 ${active ? 'text-primary' : 'text-muted hover:text-white'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);