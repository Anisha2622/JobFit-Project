import React, { useState } from 'react';
import axios from 'axios';

// --- SHARED UTILITY COMPONENTS ---
const InputField = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={placeholder}
        />
    </div>
);

const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);


// --- AUTHENTICATION PAGE AND COMPONENTS ---
export default function AuthPage({ onAuthSuccess }) {
    const [currentView, setCurrentView] = useState('landing');

    const navigateTo = (view) => {
        setCurrentView(view);
    };

    switch (currentView) {
        case 'hr-login':
            return <LoginPage userType="HR" onNavigate={navigateTo} onAuthSuccess={onAuthSuccess} />;
        case 'candidate-login':
            return <LoginPage userType="Candidate" onNavigate={navigateTo} onAuthSuccess={onAuthSuccess} />;
        case 'hr-register':
            return <RegisterPage userType="HR" onNavigate={navigateTo} onAuthSuccess={onAuthSuccess} />;
        case 'candidate-register':
            return <RegisterPage userType="Candidate" onNavigate={navigateTo} onAuthSuccess={onAuthSuccess} />;
        default:
            return <LandingPage onNavigate={navigateTo} />;
    }
}

const LandingPage = ({ onNavigate }) => {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 text-center">
            <header className="mb-12">
                <h1 className="text-5xl font-bold text-gray-800">JobFit</h1>
                <p className="text-gray-500 mt-2 text-lg">AI-Powered Resume Analysis Platform</p>
            </header>
            <main className="grid md:grid-cols-2 gap-8">
                <PortalCard
                    icon={<UserGroupIcon />}
                    title="HR Portal"
                    description="Create jobs, upload resumes, and analyze candidates."
                    buttonText="Login as HR"
                    onButtonClick={() => onNavigate('hr-login')}
                    secondaryButtonText="Register as HR"
                    onSecondaryButtonClick={() => onNavigate('hr-register')}
                />
                <PortalCard
                    icon={<UserIcon />}
                    title="Candidate Portal"
                    description="Browse jobs, apply, and track your applications."
                    buttonText="Login as Candidate"
                    onButtonClick={() => onNavigate('candidate-login')}
                    secondaryButtonText="Register as Candidate"
                    onSecondaryButtonClick={() => onNavigate('candidate-register')}
                />
            </main>
        </div>
    );
};

const PortalCard = ({ icon, title, description, buttonText, onButtonClick, secondaryButtonText, onSecondaryButtonClick }) => {
    return (
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 flex flex-col items-center justify-between hover:shadow-lg transition-shadow duration-300">
            <div className="text-center">
                <div className="flex justify-center items-center mb-4 text-blue-600">
                    {icon}
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-500 mb-6">{description}</p>
            </div>
            <div className="w-full flex flex-col space-y-3">
                 <button 
                    onClick={onButtonClick}
                    className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                >
                    {buttonText}
                </button>
                <button 
                    onClick={onSecondaryButtonClick}
                    className="w-full bg-white text-gray-600 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors duration-300">
                    {secondaryButtonText}
                </button>
            </div>
        </div>
    );
};

const LoginPage = ({ userType, onNavigate, onAuthSuccess }) => {
    const isHR = userType === 'HR';
    const [formData, setFormData] = useState({ userType: userType, jobId: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        try {
            const url = 'http://localhost:5000/api/auth/login';
            const response = await axios.post(url, formData);
            if (response.data.token) {
                onAuthSuccess(response.data.token);
            }
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Login failed.');
        }
    };
    return (
        <div className="w-full max-w-md mx-auto">
             <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
                <button onClick={() => onNavigate('landing')} className="text-sm text-blue-600 hover:underline mb-6">&larr; Back to selection</button>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">{userType} Login</h2>
                <p className="text-gray-500 text-center mb-8">Welcome back!</p>
                <form className="space-y-6" onSubmit={onSubmit}>
                    {isHR ? (
                        <>
                            <InputField label="Job ID" name="jobId" value={formData.jobId} onChange={onChange} placeholder="Enter your secure Job ID"/>
                            <InputField label="Password" name="password" type="password" value={formData.password} onChange={onChange} placeholder="••••••••"/>
                        </>
                    ) : (
                        <>
                            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={onChange} placeholder="you@example.com"/>
                            <InputField label="Password" name="password" type="password" value={formData.password} onChange={onChange} placeholder="••••••••"/>
                        </>
                    )}
                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Login</button>
                </form>
                {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <button onClick={() => onNavigate(isHR ? 'hr-register' : 'candidate-register')} className="font-medium text-blue-600 hover:underline">Register here</button>
                </p>
             </div>
        </div>
    );
};

const RegisterPage = ({ userType, onNavigate, onAuthSuccess }) => {
    const isHR = userType === 'HR';
    const [formData, setFormData] = useState({ userType: userType, companyName: '', jobId: '', password: '', fullName: '', email: '' });
    const [message, setMessage] = useState('');
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        try {
            const url = 'http://localhost:5000/api/auth/register';
            const response = await axios.post(url, formData);
            if (response.data.token) {
                onAuthSuccess(response.data.token);
            }
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Registration failed.');
        }
    };
    return (
        <div className="w-full max-w-md mx-auto">
             <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
                <button onClick={() => onNavigate('landing')} className="text-sm text-blue-600 hover:underline mb-6">&larr; Back to selection</button>
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Create {userType} Account</h2>
                <p className="text-gray-500 text-center mb-8">Get started with JobFit</p>
                <form className="space-y-6" onSubmit={onSubmit}>
                    {isHR ? (
                        <>
                            <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={onChange} placeholder="Your Company Inc."/>
                            <InputField label="Job ID" name="jobId" value={formData.jobId} onChange={onChange} placeholder="Create a secure Job ID"/>
                            <InputField label="Password" name="password" type="password" value={formData.password} onChange={onChange} placeholder="••••••••"/>
                        </>
                    ) : (
                        <>
                            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={onChange} placeholder="John Doe"/>
                            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={onChange} placeholder="you@example.com"/>
                            <InputField label="Password" name="password" type="password" value={formData.password} onChange={onChange} placeholder="••••••••"/>
                        </>
                    )}
                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Create Account</button>
                </form>
                {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
                 <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <button onClick={() => onNavigate(isHR ? 'hr-login' : 'candidate-login')} className="font-medium text-blue-600 hover:underline">Login here</button>
                </p>
             </div>
        </div>
    );
};
