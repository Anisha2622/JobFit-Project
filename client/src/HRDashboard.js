import React, { useState, useEffect } from 'react';
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

const DashboardTab = ({ id, activeTab, setActiveTab, children }) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${
                isActive 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            {children}
        </button>
    );
};

// --- HR DASHBOARD AND COMPONENTS ---
export default function HRDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('applications');

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 min-h-[80vh] w-full max-w-6xl mx-auto">
                <header className="flex justify-between items-center pb-4 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">HR Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-600 hover:text-blue-600">Profile</button>
                        <button onClick={onLogout} className="text-gray-600 hover:text-blue-600">Logout</button>
                    </div>
                </header>
                <nav className="flex space-x-2 border-b mt-4">
                    <DashboardTab id="createJob" activeTab={activeTab} setActiveTab={setActiveTab}>Create Job</DashboardTab>
                    <DashboardTab id="applications" activeTab={activeTab} setActiveTab={setActiveTab}>Applications</DashboardTab>
                </nav>
                <main className="mt-6">
                    {activeTab === 'createJob' ? <CreateJob /> : <CandidateApplications />}
                </main>
            </div>
        </div>
    );
};

const CandidateApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/applications/hr');
                setApplications(res.data);
            } catch (err) {
                setError('Could not fetch applications.');
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`http://localhost:5000/api/applications/${id}/status`, { status });
            setApplications(applications.map(app => 
                app._id === id ? { ...app, status: status } : app
            ));
        } catch (err) {
            alert('Failed to update status.');
        }
    };

    if (loading) return <p>Loading applications...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Candidate Applications</h2>
            <div className="space-y-4">
                {applications.length > 0 ? (
                    applications.map(app => (
                        <ApplicationCard key={app._id} application={app} onStatusUpdate={handleStatusUpdate} />
                    ))
                ) : (
                    <p>No applications received yet.</p>
                )}
            </div>
        </div>
    );
};

const ApplicationCard = ({ application, onStatusUpdate }) => {
    const resumeUrl = `http://localhost:5000/${application.resumeUrl.replace(/\\/g, '/')}`;

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-gray-800">{application.fullName}</h3>
                <p className="text-gray-600">{application.jobId.jobTitle}</p>
                <p className="text-sm text-gray-500 mt-1 font-semibold">
                    ATS Score: {application.atsScore ? `${application.atsScore}` : 'Processing...'}
                </p>
            </div>
            <div className="flex items-center space-x-3">
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download</a>
                {application.status === 'Pending' ? (
                    <>
                        <button onClick={() => onStatusUpdate(application._id, 'Accepted')} className="text-green-600 hover:text-green-800">✓</button>
                        <button onClick={() => onStatusUpdate(application._id, 'Rejected')} className="text-red-600 hover:text-red-800">×</button>
                    </>
                ) : (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        application.status === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {application.status}
                    </span>
                )}
            </div>
        </div>
    );
};

const CreateJob = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        jobTitle: '',
        experience: '',
        jobDescription: ''
    });
    const [skills, setSkills] = useState([]);
    const [currentSkill, setCurrentSkill] = useState('');
    const [message, setMessage] = useState('');

    const { companyName, jobTitle, experience, jobDescription } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const addSkill = () => {
        if (currentSkill && !skills.includes(currentSkill)) {
            setSkills([...skills, currentSkill]);
            setCurrentSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        if (skills.length === 0) {
            setMessage('Please add at least one required skill.');
            return;
        }
        try {
            const jobData = { ...formData, skills };
            await axios.post('http://localhost:5000/api/jobs', jobData);
            setMessage('Job created successfully!');
            setFormData({ companyName: '', jobTitle: '', experience: '', jobDescription: '' });
            setSkills([]);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Failed to create job.');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Job</h2>
            <form onSubmit={onSubmit} className="space-y-4">
                <InputField label="Company Name" name="companyName" value={companyName} onChange={onChange} placeholder="Enter company name" />
                <InputField label="Job Title" name="jobTitle" value={jobTitle} onChange={onChange} placeholder="Enter job title" />
                <InputField label="Experience (Years)" name="experience" value={experience} onChange={onChange} placeholder="e.g., 2-4" />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Skills Required</label>
                    <div className="flex items-center mt-1">
                        <input
                            type="text"
                            value={currentSkill}
                            onChange={e => setCurrentSkill(e.target.value)}
                            className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Add skill"
                        />
                        <button type="button" onClick={addSkill} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map(skill => (
                            <span key={skill} className="flex items-center bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {skill}
                                <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-gray-600 hover:text-gray-900">&times;</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description</label>
                    <textarea
                        name="jobDescription"
                        value={jobDescription}
                        onChange={onChange}
                        rows="4"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter job description"
                    ></textarea>
                </div>
                
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">Create Job</button>
            </form>
            {message && <p className="mt-4 text-center">{message}</p>}
        </div>
    );
};
