import React, { useState, useEffect, useMemo } from 'react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    deleteDoc, 
    doc,
    query,
    orderBy
} from 'firebase/firestore';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Icons ---
const DollarSignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const TrendingDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
);
const PieChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);


// --- Main Application Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p>Loading...</p></div>;
    }

    return user ? <BudgetPlanner user={user} /> : <AuthScreen />;
}

// --- Authentication Screen Component ---
const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
                <h1 className="text-3xl font-bold text-center mb-2">{isLogin ? 'Welcome Back!' : 'Create Account'}</h1>
                <p className="text-gray-600 text-center mb-6">{isLogin ? 'Sign in to continue' : 'Get started with your budget'}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-md" required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-md" required />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-semibold">{isLogin ? 'Login' : 'Sign Up'}</button>
                </form>
                <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-center text-blue-600 hover:underline">
                    {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                </button>
            </div>
        </div>
    );
};


// --- Budget Planner Component (The main app for logged-in users) ---
const BudgetPlanner = ({ user }) => {
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // --- Fetch data from Firestore on component mount ---
    useEffect(() => {
        if (!user) return;
        
        // Setup listener for incomes
        const incomeCol = collection(db, 'users', user.uid, 'incomes');
        const incomeQuery = query(incomeCol, orderBy('date', 'desc'));
        const unsubscribeIncomes = onSnapshot(incomeQuery, (snapshot) => {
            const fetchedIncomes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setIncomes(fetchedIncomes);
        });

        // Setup listener for expenses
        const expenseCol = collection(db, 'users', user.uid, 'expenses');
        const expenseQuery = query(expenseCol, orderBy('date', 'desc'));
        const unsubscribeExpenses = onSnapshot(expenseQuery, (snapshot) => {
            const fetchedExpenses = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setExpenses(fetchedExpenses);
        });

        // Cleanup listeners on unmount
        return () => {
            unsubscribeIncomes();
            unsubscribeExpenses();
        };

    }, [user]);

    // --- Data Calculation ---
    const { totalIncome, totalExpenses, balance } = useMemo(() => {
        const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const balance = totalIncome - totalExpenses;
        return { totalIncome, totalExpenses, balance };
    }, [incomes, expenses]);

    const expenseCategories = ['Housing', 'Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Other'];
    const categoryColors = {
        Housing: 'bg-blue-500', Food: 'bg-green-500', Transport: 'bg-yellow-500',
        Utilities: 'bg-purple-500', Health: 'bg-red-500', Entertainment: 'bg-pink-500', Other: 'bg-gray-500',
    };

    // --- Handlers ---
    const addItem = async (type, item) => {
        const collectionRef = collection(db, 'users', user.uid, type === 'income' ? 'incomes' : 'expenses');
        await addDoc(collectionRef, item);
    };

    const deleteItem = async (type, id) => {
        const docRef = doc(db, 'users', user.uid, type === 'income' ? 'incomes' : 'expenses', id);
        await deleteDoc(docRef);
    };

    const handleSignOut = () => {
        signOut(auth).catch(error => console.error("Sign out error", error));
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Monthly Expense Tracker</h1>
                        <p className="text-gray-600 mt-1">Signed in as: {user.email}</p>
                    </div>
                    <button onClick={handleSignOut} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <LogoutIcon />
                        <span>Sign Out</span>
                    </button>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <SummaryCard totalIncome={totalIncome} totalExpenses={totalExpenses} balance={balance} />
                        <TransactionForm type="income" onAddItem={addItem} />
                        <TransactionForm type="expense" onAddItem={addItem} expenseCategories={expenseCategories} />
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                        <Visualization expenses={expenses} totalExpenses={totalExpenses} categories={expenseCategories} colors={categoryColors} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <TransactionList title="Income" items={incomes} onDeleteItem={deleteItem} type="income" />
                           <TransactionList title="Expenses" items={expenses} onDeleteItem={deleteItem} type="expense" />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// --- Sub-Components (largely unchanged, but now receive data from Firebase) ---
const SummaryCard = ({ totalIncome, totalExpenses, balance }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
        <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full"><DollarSignIcon className="text-green-600" /></div>
                    <span className="font-medium text-green-800">Total Income</span>
                </div>
                <span className="font-bold text-lg text-green-600">£{totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                     <div className="bg-red-100 p-2 rounded-full"><TrendingDownIcon className="text-red-600" /></div>
                    <span className="font-medium text-red-800">Total Expenses</span>
                </div>
                <span className="font-bold text-lg text-red-600">£{totalExpenses.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between items-center p-4 rounded-lg ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}><PieChartIcon className={`${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} /></div>
                    <span className={`font-medium ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Balance</span>
                </div>
                <span className={`font-bold text-lg ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>£{balance.toFixed(2)}</span>
            </div>
        </div>
    </div>
);

const TransactionForm = ({ type, onAddItem, expenseCategories }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(expenseCategories ? expenseCategories[0] : '');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !amount || parseFloat(amount) <= 0) {
            // In a real app, show a proper toast notification instead of an alert
            console.error("Please provide a valid name and positive amount.");
            return;
        };

        const newItem = {
            // Note: 'name' is for expenses, 'source' is for incomes
            ...(type === 'expense' ? { name: name.trim() } : { source: name.trim() }),
            amount: parseFloat(amount),
            date,
            ...(type === 'expense' && { category }),
        };
        onAddItem(type, newItem);
        
        setName('');
        setAmount('');
    };

    const isExpense = type === 'expense';
    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 capitalize">Add New {type}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor={`${type}-name`} className="block text-sm font-medium text-gray-700">{isExpense ? 'Expense Name' : 'Income Source'}</label>
                    <input type="text" id={`${type}-name`} value={name} onChange={(e) => setName(e.target.value)} placeholder={isExpense ? 'e.g., Coffee' : 'e.g., Side Hustle'} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <div>
                    <label htmlFor={`${type}-amount`} className="block text-sm font-medium text-gray-700">Amount (£)</label>
                    <input type="number" id={`${type}-amount`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                {isExpense && (
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2">
                            {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor={`${type}-date`} className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" id={`${type}-date`} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <button type="submit" className={`w-full py-2 px-4 rounded-md shadow-sm font-medium text-white ${isExpense ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} transition-colors`}>Add {type}</button>
            </form>
        </div>
    );
};

const TransactionList = ({ title, items, onDeleteItem, type }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {items.length > 0 ? items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                        <p className="font-medium text-gray-800">{item.name || item.source}</p>
                        <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString('en-GB')} {type === 'expense' && `· ${item.category}`}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className={`font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>£{item.amount.toFixed(2)}</span>
                        <button onClick={() => onDeleteItem(type, item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><TrashIcon /></button>
                    </div>
                </div>
            )) : (<p className="text-gray-500 italic text-center py-4">No {type}s added yet.</p>)}
        </div>
    </div>
);

const Visualization = ({ expenses, totalExpenses, categories, colors }) => {
    const categoryTotals = useMemo(() => {
        const totals = categories.reduce((acc, category) => ({ ...acc, [category]: 0 }), {});
        expenses.forEach(expense => {
            if (totals[expense.category] !== undefined) totals[expense.category] += expense.amount;
        });
        return totals;
    }, [expenses, categories]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
            {totalExpenses > 0 ? (
                <>
                    <div className="flex w-full h-8 bg-gray-200 rounded-full overflow-hidden mb-4">
                        {categories.map(cat => {
                            const percentage = (categoryTotals[cat] / totalExpenses) * 100;
                            if (percentage === 0) return null;
                            return <div key={cat} className={`${colors[cat]}`} style={{ width: `${percentage}%` }} title={`${cat}: ${percentage.toFixed(1)}%`}></div>;
                        })}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {categories.map(cat => {
                             if (categoryTotals[cat] === 0) return null;
                             return (
                                <div key={cat} className="flex items-center text-sm">
                                    <span className={`w-3 h-3 rounded-full mr-2 ${colors[cat]}`}></span>
                                    <span className="font-medium text-gray-700">{cat}:</span>
                                    <span className="ml-auto text-gray-600">£{categoryTotals[cat].toFixed(2)}</span>
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : (<p className="text-gray-500 italic text-center py-4">No expenses to visualize.</p>)}
        </div>
    );
};

