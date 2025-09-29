import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// --- Reusable UI Components ---

const InputField = ({ id, name, type, placeholder, value, onChange, required = true }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{placeholder}</label>
        <input
            id={id}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
    </div>
);

const Button = ({ children, type = 'submit', onClick, variant = 'primary', disabled = false }) => {
    const baseClasses = "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500"
    };
    return (
        <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]}`} disabled={disabled}>
            {children}
        </button>
    );
};

const ErrorMessage = ({ message }) => {
    if (!message) return null;
    return <p className="mt-2 text-sm text-red-600">{message}</p>;
};

// --- Main Application Logic ---

const API_BASE_URL = 'http://localhost:5000';

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedUser = jwtDecode(storedToken);
                const currentTime = Date.now() / 1000;
                if (decodedUser.exp < currentTime) {
                    handleLogout();
                } else {
                    setUser(decodedUser.user);
                    setToken(storedToken);
                }
            } catch (error) {
                console.error("Invalid token:", error);
                handleLogout();
            }
        }
        setIsLoading(false);
    }, [handleLogout]);

    const handleLogin = (newToken) => {
        localStorage.setItem('token', newToken);
        const decodedUser = jwtDecode(newToken);
        setUser(decodedUser.user);
        setToken(newToken);
    };
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user || !token) {
        return <AuthPage onLogin={handleLogin} />;
    }

    if (user.userType === 'HR') {
        return <HRDashboard onLogout={handleLogout} token={token} />;
    }

    if (user.userType === 'Candidate') {
        return <CandidateDashboard onLogout={handleLogout} token={token} />;
    }

    return <AuthPage onLogin={handleLogin} />;
}


// --- Authentication Pages ---

const AuthPage = ({ onLogin }) => {
    const [view, setView] = useState('landing'); 

    const renderContent = () => {
        switch (view) {
            case 'hrLogin':
                return <LoginPage userType="HR" onLogin={onLogin} setView={setView} />;
            case 'candidateLogin':
                return <LoginPage userType="Candidate" onLogin={onLogin} setView={setView} />;
            case 'hrRegister':
                return <RegisterPage userType="HR" onLogin={onLogin} setView={setView} />;
            case 'candidateRegister':
                return <RegisterPage userType="Candidate" onLogin={onLogin} setView={setView} />;
            default:
                return <LandingPage setView={setView} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            {renderContent()}
        </div>
    );
};

const LandingPage = ({ setView }) => (
    <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">JobFit</h1>
        <p className="text-lg text-gray-600 mb-8">Resume Analysis Platform</p>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">HR Portal</h2>
                <p className="text-gray-500 mb-6">Create jobs, apply, and analyze candidates.</p>
                <div className="space-y-4">
                    <Button onClick={() => setView('hrLogin')}>Login as HR</Button>
                    <Button onClick={() => setView('hrRegister')} variant="secondary">Register as HR</Button>
                </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Candidate Portal</h2>
                <p className="text-gray-500 mb-6">Browse jobs, apply with ease, and track your application status.</p>
                 <div className="space-y-4">
                    <Button onClick={() => setView('candidateLogin')}>Login as Candidate</Button>
                    <Button onClick={() => setView('candidateRegister')} variant="secondary">Register as Candidate</Button>
                </div>
            </div>
        </div>
    </div>
);

const LoginPage = ({ userType, onLogin, setView }) => {
    const [formData, setFormData] = useState({ password: '', jobId: '', email: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const payload = { userType, ...formData };
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, payload);
            onLogin(res.data.token);
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <button onClick={() => setView('landing')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to selection</button>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Login as {userType}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {userType === 'HR' ? (
                    <InputField id="jobId" name="jobId" type="text" placeholder="Job ID" value={formData.jobId} onChange={handleChange} />
                ) : (
                    <InputField id="email" name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
                )}
                <InputField id="password" name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
                <ErrorMessage message={error} />
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</Button>
            </form>
        </div>
    );
};

const RegisterPage = ({ userType, onLogin, setView }) => {
    const [formData, setFormData] = useState({
        companyName: '', jobId: '', password: '', fullName: '', email: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const payload = { userType, ...formData };
            const res = await axios.post(`${API_BASE_URL}/api/auth/register`, payload);
            onLogin(res.data.token);
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
            <button onClick={() => setView('landing')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to selection</button>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Create {userType} Account</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {userType === 'HR' ? (
                    <>
                        <InputField id="companyName" name="companyName" type="text" placeholder="Company Name" value={formData.companyName} onChange={handleChange} />
                        <InputField id="jobId" name="jobId" type="text" placeholder="Job ID" value={formData.jobId} onChange={handleChange} />
                    </>
                ) : (
                    <>
                        <InputField id="fullName" name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} />
                        <InputField id="email" name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
                    </>
                )}
                <InputField id="password" name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
                <ErrorMessage message={error} />
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating Account...' : 'Create Account'}</Button>
            </form>
        </div>
    );
};

// --- HR Dashboard ---
const HRDashboard = ({ onLogout, token }) => {
    const [view, setView] = useState('dashboard');
    const [jobs, setJobs] = useState([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    
    const tabs = {
        dashboard: 'Dashboard',
        createJob: 'Create Job',
        uploadResumes: 'Upload Resumes',
        applications: 'Applications',
    };

    const fetchJobs = useCallback(async () => {
        setIsLoadingJobs(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/jobs/my-jobs`, {
                headers: { 'x-auth-token': token }
            });
            setJobs(res.data);
        } catch (err) {
            console.error("Failed to fetch HR jobs");
        } finally {
            setIsLoadingJobs(false);
        }
    }, [token]);

    useEffect(() => {
        if (view === 'dashboard' || view === 'uploadResumes') {
            fetchJobs();
        }
    }, [view, fetchJobs]);

    const renderTabContent = () => {
        switch (view) {
            case 'dashboard': 
                return <HRJobDashboard jobs={jobs} isLoading={isLoadingJobs} />;
            case 'createJob': 
                return <CreateJob token={token} onJobCreated={() => { setView('dashboard'); fetchJobs(); }} />;
            case 'uploadResumes':
                return <UploadResumes token={token} jobs={jobs} isLoadingJobs={isLoadingJobs} />;
            case 'applications': 
                return <Applications token={token} />;
            case 'profile':
                return <ProfilePage token={token} userType="HR" />;
            default: 
                return null;
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setView('profile')} className="text-sm font-medium text-gray-600 hover:text-blue-500">Profile</button>
                        <button onClick={onLogout} className="text-sm font-medium text-blue-600 hover:text-blue-500">Logout</button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {view !== 'profile' && (
                         <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {Object.entries(tabs).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => setView(key)}
                                        className={`${
                                            view === key
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}
                    <div className="mt-6">{renderTabContent()}</div>
                </div>
            </main>
        </div>
    );
};

const HRJobDashboard = ({ jobs, isLoading }) => {
    if (isLoading) return <div className="text-center p-4">Loading your job postings...</div>;

    if (jobs.length === 0) {
        return <div className="bg-white p-8 rounded-lg shadow-md text-center">You haven't created any jobs yet. Click 'Create Job' to get started.</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Your Job Postings</h2>
            {jobs.map(job => (
                <div key={job._id} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{job.jobTitle}</h3>
                            <p className="text-md text-gray-600">{job.companyName}</p>
                            <p className="text-sm text-gray-500 mt-2">Posted on: {new Date(job.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex space-x-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-green-600">{job.applicationStats.accepted}</p>
                                <p className="text-xs text-gray-500">Accepted</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">{job.applicationStats.rejected}</p>
                                <p className="text-xs text-gray-500">Rejected</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const CreateJob = ({ token, onJobCreated }) => {
    const [formData, setFormData] = useState({
        companyName: '', jobTitle: '', experience: '', jobDescription: ''
    });
    const [skills, setSkills] = useState([{ name: '', rating: 3 }]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSkillChange = (index, e) => {
        const newSkills = [...skills];
        newSkills[index].name = e.target.value;
        setSkills(newSkills);
    };
    
    const handleRatingChange = (index, newRating) => {
        const newSkills = [...skills];
        newSkills[index].rating = newRating;
        setSkills(newSkills);
    };

    const addSkill = () => {
        setSkills([...skills, { name: '', rating: 3 }]);
    };
    
    const removeSkill = (index) => {
        const newSkills = skills.filter((_, i) => i !== index);
        setSkills(newSkills);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/jobs`, { ...formData, skills }, {
                headers: { 'x-auth-token': token }
            });
            setMessage('Job created successfully!');
            setFormData({ companyName: '', jobTitle: '', experience: '', jobDescription: '' });
            setSkills([{ name: '', rating: 3 }]);
            onJobCreated();
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Failed to create job.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Create New Job</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="companyName" name="companyName" type="text" placeholder="Company Name" value={formData.companyName} onChange={handleChange} />
                <InputField id="jobTitle" name="jobTitle" type="text" placeholder="Job Title" value={formData.jobTitle} onChange={handleChange} />
                <InputField id="experience" name="experience" type="text" placeholder="Experience (e.g., 2-4 years)" value={formData.experience} onChange={handleChange} />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Skills Required</label>
                    {skills.map((skill, index) => (
                        <div key={index} className="flex items-center space-x-4 mt-2">
                            <input type="text" name="name" placeholder="Skill (e.g., React)" value={skill.name} onChange={(e) => handleSkillChange(index, e)} className="flex-grow mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map(ratingValue => (
                                    <button
                                        key={ratingValue}
                                        type="button"
                                        onClick={() => handleRatingChange(index, ratingValue)}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold focus:outline-none transition-colors ${
                                            skill.rating === ratingValue ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }`}
                                    >
                                        {ratingValue}
                                    </button>
                                ))}
                            </div>
                            {skills.length > 1 && <button type="button" onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700 font-bold text-xl">&minus;</button>}
                        </div>
                    ))}
                    <button type="button" onClick={addSkill} className="mt-2 text-blue-500 hover:text-blue-700 font-bold text-xl">+</button>
                </div>

                <div>
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description</label>
                    <textarea id="jobDescription" name="jobDescription" rows="4" value={formData.jobDescription} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
                
                {message && <p className={message.includes('successfully') ? 'text-green-600' : 'text-red-600'}>{message}</p>}
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating Job...' : 'Create Job'}</Button>
            </form>
        </div>
    );
};

const UploadResumes = ({ token, jobs, isLoadingJobs }) => {
    const [selectedJob, setSelectedJob] = useState('');
    const [files, setFiles] = useState(null);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFiles(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedJob || !files) {
            setError('Please select a job and choose resume files to upload.');
            return;
        }
        setError('');
        setIsLoading(true);
        setResults([]);

        const formData = new FormData();
        formData.append('jobId', selectedJob);
        for (let i = 0; i < files.length; i++) {
            formData.append('resumes', files[i]);
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/analyze/resumes`, formData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            const sortedResults = res.data.sort((a, b) => b.atsScore - a.atsScore);
            setResults(sortedResults);
        } catch (err) {
            setError(err.response?.data?.msg || 'Analysis failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload Resumes for Analysis</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="job-select" className="block text-sm font-medium text-gray-700">Select Job</label>
                    <select
                        id="job-select"
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        disabled={isLoadingJobs}
                    >
                        <option value="">{isLoadingJobs ? 'Loading jobs...' : '--Please choose a job--'}</option>
                        {jobs.map(job => (
                            <option key={job._id} value={job._id}>{job.jobTitle} at {job.companyName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="resume-upload" className="block text-sm font-medium text-gray-700">Upload Resumes (up to 10)</label>
                    <input id="resume-upload" type="file" multiple onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <ErrorMessage message={error} />
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Analyzing...' : 'Analyze Resumes'}</Button>
            </form>

            {results.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium">Analysis Results</h3>
                    <ul className="mt-4 space-y-3">
                        {results.map((result, index) => (
                            <li key={index} className="bg-gray-50 p-4 rounded-md border">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-gray-800">{result.fileName}</p>
                                    <p className={`font-bold text-lg ${result.atsScore > 75 ? 'text-green-600' : result.atsScore > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        ATS Score: {result.atsScore}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{result.summary}</p>
                                {result.matchedSkills && result.matchedSkills.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700">Matched Skills:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {result.matchedSkills.map((skill, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const Applications = ({ token }) => {
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/applications/hr`, {
                headers: { 'x-auth-token': token }
            });
            setApplications(res.data);
        } catch (err) {
            console.error("Failed to fetch applications");
        } finally {
            setIsLoading(false);
        }
    }, [token]);
    
    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);
    
    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/applications/${id}/status`, { status }, {
                headers: { 'x-auth-token': token }
            });
            fetchApplications();
        } catch (err) {
            alert('Failed to update status.');
        }
    };

    if (isLoading) return <div className="text-center p-4">Loading applications...</div>;
    if (applications.length === 0) return <div className="bg-white p-8 rounded-lg shadow-md text-center">No applications received yet.</div>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Candidate Applications</h2>
            <div className="space-y-4">
                {applications.map(app => (
                    <div key={app._id} className="p-4 border rounded-md bg-gray-50">
                        <div className="flex flex-wrap justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-gray-800">{app.fullName}</p>
                                <p className="text-sm text-gray-600">Applying for: {app.jobId.jobTitle}</p>
                                <p className="text-sm text-gray-500 mt-1">ATS Score: <span className="font-bold">{app.atsScore === undefined ? 'N/A' : app.atsScore}</span></p>
                            </div>
                            <div className="flex items-center space-x-2 mt-2 md:mt-0">
                                <a href={`${API_BASE_URL}/${app.resumeUrl.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Download Resume</a>
                                {app.status === 'Pending' ? (
                                    <>
                                        <button onClick={() => handleStatusUpdate(app._id, 'Accepted')} className="p-2 text-green-600 hover:text-green-800">&#10003;</button>
                                        <button onClick={() => handleStatusUpdate(app._id, 'Rejected')} className="p-2 text-red-600 hover:text-red-800">&#10005;</button>
                                    </>
                                ) : (
                                    <span className={`text-sm font-semibold ${app.status === 'Accepted' ? 'text-green-600' : 'text-red-600'}`}>{app.status}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Candidate Dashboard (Complete Implementation) ---
const CandidateDashboard = ({ onLogout, token }) => {
    const [view, setView] = useState('jobList'); 
    const [selectedJob, setSelectedJob] = useState(null);

    const handleApplyNow = (job) => {
        setSelectedJob(job);
        setView('jobDetails');
    };

    const renderContent = () => {
        switch (view) {
            case 'jobDetails':
                return <JobDetails job={selectedJob} setView={setView} />;
            case 'applyForm':
                return <ApplicationForm job={selectedJob} setView={setView} token={token} />;
            case 'myApplications':
                return <MyApplications token={token} />;
            case 'profile':
                return <ProfilePage token={token} userType="Candidate" />;
            case 'jobList':
            default:
                return <JobList onApplyNow={handleApplyNow} />;
        }
    };
    
    return (
        <div className="w-full min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Candidate Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setView('profile')} className="text-sm font-medium text-gray-600 hover:text-blue-500">Profile</button>
                        <button onClick={onLogout} className="text-sm font-medium text-blue-600 hover:text-blue-500">Logout</button>
                    </div>
                </div>
            </header>
            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {view !== 'profile' && (
                        <div className="border-b border-gray-200 mb-4">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button onClick={() => setView('jobList')} className={`${view === 'jobList' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} py-4 px-1 border-b-2 font-medium text-sm`}>Available Jobs</button>
                                <button onClick={() => setView('myApplications')} className={`${view === 'myApplications' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} py-4 px-1 border-b-2 font-medium text-sm`}>My Applications</button>
                            </nav>
                        </div>
                    )}
                    <div className="mt-6">{renderContent()}</div>
                </div>
            </main>
        </div>
    );
};

const JobList = ({ onApplyNow }) => {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/jobs`);
                setJobs(res.data);
            } catch (err) {
                console.error("Failed to fetch jobs");
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (isLoading) return <div className="text-center p-4">Loading jobs...</div>;

    return (
        <div className="space-y-6">
            {jobs.map(job => (
                <div key={job._id} className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{job.jobTitle}</h3>
                        <p className="text-md text-gray-600">{job.companyName}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {job.skills && job.skills.map((skill, index) => {
                                const skillName = typeof skill === 'object' ? skill.name || skill.skillName : skill;
                                if (!skillName) return null;
                                return (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                        {skillName}
                                    </span>
                                );
                            })}
                        </div>
                         <p className="text-sm text-gray-500 mt-2">Experience: {job.experience}</p>
                    </div>
                    <div>
                        <Button onClick={() => onApplyNow(job)}>View & Apply</Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const JobDetails = ({ job, setView }) => (
    <div className="bg-white p-8 rounded-lg shadow-md">
        <button onClick={() => setView('jobList')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Jobs</button>
        <h2 className="text-2xl font-bold text-gray-800">{job.jobTitle}</h2>
        <p className="text-lg text-gray-600 mb-4">{job.companyName}</p>
        <p className="text-md text-gray-700 font-semibold">Experience Required:</p>
        <p className="text-md text-gray-600 mb-4">{job.experience}</p>
        <p className="text-md text-gray-700 font-semibold">Skills:</p>
        <div className="flex flex-wrap gap-2 mb-4">
             {job.skills && job.skills.map((skill, index) => {
                const skillName = typeof skill === 'object' ? skill.name || skill.skillName : skill;
                const skillRating = typeof skill === 'object' && skill.rating ? `(${skill.rating}/5)` : '';
                if (!skillName) return null;
                return (
                    <span key={index} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">
                        {skillName} {skillRating}
                    </span>
                );
            })}
        </div>
        <p className="text-md text-gray-700 font-semibold">Job Description:</p>
        <p className="text-md text-gray-600 whitespace-pre-wrap">{job.jobDescription}</p>
        <div className="mt-6">
            <Button onClick={() => setView('applyForm')}>Proceed to Application</Button>
        </div>
    </div>
);

const ApplicationForm = ({ job, setView, token }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', coverLetter: '' });
    const [skills, setSkills] = useState([{ name: '', rating: 3 }]);
    const [resume, setResume] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSkillChange = (index, e) => {
        const newSkills = [...skills];
        newSkills[index].name = e.target.value;
        setSkills(newSkills);
    };
    
    const handleRatingChange = (index, newRating) => {
        const newSkills = [...skills];
        newSkills[index].rating = newRating;
        setSkills(newSkills);
    };

    const addSkill = () => {
        setSkills([...skills, { name: '', rating: 3 }]);
    };
    
    const removeSkill = (index) => {
        const newSkills = skills.filter((_, i) => i !== index);
        setSkills(newSkills);
    };

    const handleFileChange = (e) => {
        setResume(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!resume) {
            setMessage('Please upload a resume.');
            return;
        }
        setIsLoading(true);

        const applicationData = new FormData();
        applicationData.append('jobId', job._id);
        applicationData.append('fullName', formData.fullName);
        applicationData.append('email', formData.email);
        applicationData.append('phone', formData.phone);
        applicationData.append('coverLetter', formData.coverLetter);
        applicationData.append('resume', resume);
        applicationData.append('skills', JSON.stringify(skills));

        try {
            await axios.post(`${API_BASE_URL}/api/applications`, applicationData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('Application submitted successfully! Redirecting...');
            setTimeout(() => setView('myApplications'), 2000);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Application failed.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <button onClick={() => setView('jobDetails')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Job Details</button>
            <h2 className="text-2xl font-bold text-gray-800">Apply for {job.jobTitle}</h2>
            <p className="text-lg text-gray-600 mb-4">{job.companyName}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="fullName" name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} />
                <InputField id="email" name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
                <InputField id="phone" name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Your Skills</label>
                    {skills.map((skill, index) => (
                        <div key={index} className="flex items-center space-x-4 mt-2">
                            <input type="text" name="name" placeholder="Skill (e.g., Python)" value={skill.name} onChange={(e) => handleSkillChange(index, e)} className="flex-grow mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map(ratingValue => (
                                    <button
                                        key={ratingValue}
                                        type="button"
                                        onClick={() => handleRatingChange(index, ratingValue)}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold focus:outline-none transition-colors ${
                                            skill.rating === ratingValue ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }`}
                                    >
                                        {ratingValue}
                                    </button>
                                ))}
                            </div>
                           {skills.length > 1 && <button type="button" onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700 font-bold text-xl">&minus;</button>}
                        </div>
                    ))}
                    <button type="button" onClick={addSkill} className="mt-2 text-blue-500 hover:text-blue-700 font-bold text-xl">+</button>
                </div>

                <div>
                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">Cover Letter (Optional)</label>
                    <textarea id="coverLetter" name="coverLetter" rows="4" value={formData.coverLetter} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
                 <div>
                    <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Upload Resume</label>
                    <input id="resume" name="resume" type="file" onChange={handleFileChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                {message && <p className={message.includes('successfully') ? 'text-green-600' : 'text-red-600'}>{message}</p>}
                <div className="flex space-x-4">
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Submitting...' : 'Submit Application'}</Button>
                    <Button onClick={() => setView('jobDetails')} variant="secondary" type="button">Cancel</Button>
                </div>
            </form>
        </div>
    );
};

const MyApplications = ({ token }) => {
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/applications/me`, {
                    headers: { 'x-auth-token': token }
                });
                setApplications(res.data);
            } catch (err) {
                console.error("Failed to fetch my applications");
            } finally {
                setIsLoading(false);
            }
        };
        fetchApps();
    }, [token]);

    if (isLoading) return <div className="text-center p-4">Loading your applications...</div>;

    if (applications.length === 0) {
        return <div className="bg-white p-8 rounded-lg shadow-md text-center">You haven't applied to any jobs yet.</div>;
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'Accepted': return 'text-green-700 bg-green-100';
            case 'Rejected': return 'text-red-700 bg-red-100';
            default: return 'text-yellow-700 bg-yellow-100';
        }
    };
    
    return (
        <div className="space-y-6">
            {applications.map(app => (
                <div key={app._id} className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{app.jobId.jobTitle}</h3>
                        <p className="text-md text-gray-600">{app.jobId.companyName}</p>
                        <p className="text-sm text-gray-500 mt-2">Applied on: {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(app.status)}`}>
                            {app.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProfilePage = ({ token, userType }) => {
    const [profile, setProfile] = useState(null);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/profile/me`, {
                headers: { 'x-auth-token': token }
            });
            setProfile(res.data);
        } catch (err) {
            console.error("Failed to fetch profile");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await axios.put(`${API_BASE_URL}/api/profile`, profile, {
                headers: { 'x-auth-token': token }
            });
            setMessage('Profile updated successfully!');
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Failed to update profile.');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await axios.put(`${API_BASE_URL}/api/profile/password`, passwordData, {
                headers: { 'x-auth-token': token }
            });
            setMessage('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Failed to update password.');
        }
    };
    
    if (isLoading) return <div className="text-center p-4">Loading profile...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Update Profile Details</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {userType === 'HR' ? (
                        <>
                            <InputField id="companyName" name="companyName" type="text" placeholder="Company Name" value={profile?.companyName || ''} onChange={handleProfileChange} />
                            <InputField id="jobId" name="jobId" type="text" placeholder="Job ID" value={profile?.jobId || ''} onChange={handleProfileChange} />
                        </>
                    ) : (
                        <>
                            <InputField id="fullName" name="fullName" type="text" placeholder="Full Name" value={profile?.fullName || ''} onChange={handleProfileChange} />
                            <InputField id="email" name="email" type="email" placeholder="Email Address" value={profile?.email || ''} onChange={handleProfileChange} />
                        </>
                    )}
                    <Button type="submit">Update Details</Button>
                </form>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <InputField id="currentPassword" name="currentPassword" type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                    <InputField id="newPassword" name="newPassword" type="password" placeholder="New Password" value={passwordData.newPassword} onChange={handlePasswordChange} />
                    <Button type="submit">Change Password</Button>
                </form>
            </div>
             {message && <p className={`mt-4 text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
    );
};

export default App;

