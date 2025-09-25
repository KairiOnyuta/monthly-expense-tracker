import React, { useState, useEffect, useMemo } from 'react';

// --- Mock Icons (using inline SVG for simplicity) ---
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


// --- Main Application Component ---
export default function App() {
    // --- State Management ---
    // Using localStorage to persist data between sessions
    const [incomes, setIncomes] = useState(() => {
        const savedIncomes = localStorage.getItem('budgetIncomes');
        return savedIncomes ? JSON.parse(savedIncomes) : [
            { id: 1, source: 'Salary', amount: 2500, date: '2025-09-01' },
            { id: 2, source: 'Freelance Work', amount: 750, date: '2025-09-15' },
        ];
    });

    const [expenses, setExpenses] = useState(() => {
        const savedExpenses = localStorage.getItem('budgetExpenses');
        return savedExpenses ? JSON.parse(savedExpenses) : [
            { id: 1, name: 'Rent', amount: 1200, category: 'Housing', date: '2025-09-01' },
            { id: 2, name: 'Groceries', amount: 350, category: 'Food', date: '2025-09-05' },
            { id: 3, name: 'Internet Bill', amount: 60, category: 'Utilities', date: '2025-09-10' },
            { id: 4, name: 'Gym Membership', amount: 40, category: 'Health', date: '2025-09-12' },
            { id: 5, name: 'Dinner with Friends', amount: 80, category: 'Entertainment', date: '2025-09-18' },
        ];
    });

    // Save to localStorage whenever incomes or expenses change
    useEffect(() => {
        localStorage.setItem('budgetIncomes', JSON.stringify(incomes));
    }, [incomes]);

    useEffect(() => {
        localStorage.setItem('budgetExpenses', JSON.stringify(expenses));
    }, [expenses]);
    
    // --- Data Calculation using useMemo for performance ---
    const { totalIncome, totalExpenses, balance } = useMemo(() => {
        const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const balance = totalIncome - totalExpenses;
        return { totalIncome, totalExpenses, balance };
    }, [incomes, expenses]);

    const expenseCategories = ['Housing', 'Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Other'];
    const categoryColors = {
        Housing: 'bg-blue-500',
        Food: 'bg-green-500',
        Transport: 'bg-yellow-500',
        Utilities: 'bg-purple-500',
        Health: 'bg-red-500',
        Entertainment: 'bg-pink-500',
        Other: 'bg-gray-500',
    };

    // --- Handlers ---
    const addItem = (type, item) => {
        if (type === 'income') {
            setIncomes(prev => [...prev, { ...item, id: Date.now() }]);
        } else {
            setExpenses(prev => [...prev, { ...item, id: Date.now() }]);
        }
    };

    const deleteItem = (type, id) => {
        if (type === 'income') {
            setIncomes(prev => prev.filter(item => item.id !== id));
        } else {
            setExpenses(prev => prev.filter(item => item.id !== id));
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* --- Header --- */}
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Monthly Expense Tracker</h1>
                    <p className="text-gray-600 mt-1">Welcome! Track your income and expenses to gain financial clarity.</p>
                </header>

                {/* --- Main Content Grid --- */}
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- Left Column: Summary & Forms --- */}
                    <div className="lg:col-span-1 space-y-8">
                        <SummaryCard totalIncome={totalIncome} totalExpenses={totalExpenses} balance={balance} />
                        <TransactionForm type="income" onAddItem={addItem} />
                        <TransactionForm type="expense" onAddItem={addItem} expenseCategories={expenseCategories} />
                    </div>

                    {/* --- Right Column: Transactions & Visualization --- */}
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

// --- Sub-Components ---

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
            alert("Please provide a valid name and positive amount.");
            return;
        };

        const newItem = {
            name: name.trim(),
            source: name.trim(),
            amount: parseFloat(amount),
            date,
            ...(type === 'expense' && { category }),
        };
        onAddItem(type, newItem);
        
        // Reset form
        setName('');
        setAmount('');
    };

    const isExpense = type === 'expense';

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 capitalize">Add New {type}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor={`${type}-name`} className="block text-sm font-medium text-gray-700">
                        {isExpense ? 'Expense Name' : 'Income Source'}
                    </label>
                    <input
                        type="text"
                        id={`${type}-name`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isExpense ? 'e.g., Coffee' : 'e.g., Side Hustle'}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                    />
                </div>
                <div>
                    <label htmlFor={`${type}-amount`} className="block text-sm font-medium text-gray-700">Amount (£)</label>
                    <input
                        type="number"
                        id={`${type}-amount`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                    />
                </div>
                {isExpense && (
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                        >
                            {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor={`${type}-date`} className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        id={`${type}-date`}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                    />
                </div>
                <button
                    type="submit"
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isExpense ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                >
                    Add {type}
                </button>
            </form>
        </div>
    );
};

const TransactionList = ({ title, items, onDeleteItem, type }) => {
    // Sort items by date, most recent first
    const sortedItems = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sortedItems.length > 0 ? sortedItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                            <p className="font-medium text-gray-800">{item.name || item.source}</p>
                            <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString('en-GB')} {type === 'expense' && `· ${item.category}`}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                £{item.amount.toFixed(2)}
                            </span>
                            <button onClick={() => onDeleteItem(type, item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-500 italic text-center py-4">No {type}s added yet.</p>
                )}
            </div>
        </div>
    );
};


const Visualization = ({ expenses, totalExpenses, categories, colors }) => {
    const categoryTotals = useMemo(() => {
        const totals = categories.reduce((acc, category) => ({ ...acc, [category]: 0 }), {});
        expenses.forEach(expense => {
            if (totals[expense.category] !== undefined) {
                totals[expense.category] += expense.amount;
            }
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
                            return (
                                <div
                                    key={cat}
                                    className={`${colors[cat]} transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                    title={`${cat}: ${percentage.toFixed(1)}%`}
                                ></div>
                            );
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
            ) : (
                <p className="text-gray-500 italic text-center py-4">No expenses to visualize.</p>
            )}
        </div>
    );
};
