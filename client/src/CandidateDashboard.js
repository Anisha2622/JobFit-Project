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

// --- CANDIDATE DASHBOARD AND COMPONENTS ---
export default function CandidateDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('availableJobs');
    const [selectedJob, setSelectedJob] = useState(null); 

    const handleApplyNow = (job) => {
        setSelectedJob(job);
    };

    const handleCancelApplication = () => {
        setSelectedJob(null);
    };

    const handleApplicationSuccess = () => {
        setSelectedJob(null); 
        setActiveTab('myApplications'); 
    };

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 min-h-[80vh] w-full max-w-6xl mx-auto">
                <header className="flex justify-between items-center pb-4 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">Candidate Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-600 hover:text-blue-600">Profile</button>
                        <button onClick={onLogout} className="text-gray-600 hover:text-blue-600">Logout</button>
                    </div>
                </header>
                {!selectedJob && (
                    <nav className="flex space-x-2 border-b mt-4">
                        <DashboardTab id="availableJobs" activeTab={activeTab} setActiveTab={setActiveTab}>Available Jobs</DashboardTab>
                        <DashboardTab id="myApplications" activeTab={activeTab} setActiveTab={setActiveTab}>My Applications</DashboardTab>
                    </nav>
                )}
                <main className="mt-6">
                    {selectedJob ? (
                        <ApplicationForm job={selectedJob} onCancel={handleCancelApplication} onSuccess={handleApplicationSuccess} />
                    ) : activeTab === 'availableJobs' ? (
                        <AvailableJobs onApplyNow={handleApplyNow} />
                    ) : (
                        <div><h2>My Applications</h2><p>Your submitted applications will appear here.</p></div>
                    )}
                </main>
            </div>
        </div>
    );
};

const AvailableJobs = ({ onApplyNow }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/jobs');
                setJobs(res.data);
            } catch (err) {
                setError('Could not fetch jobs.');
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) return <p>Loading jobs...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Available Jobs</h2>
            <div className="space-y-4">
                {jobs.length > 0 ? (
                    jobs.map(job => <JobCard key={job._id} job={job} onApplyNow={onApplyNow} />)
                ) : (
                    <p>No jobs available at the moment.</p>
                )}
            </div>
        </div>
    );
};

const JobCard = ({ job, onApplyNow }) => {
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-gray-800">{job.jobTitle}</h3>
                <p className="text-gray-600">{job.companyName}</p>
                <p className="text-sm text-gray-500 mt-2">Experience: {job.experience} years</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className="font-medium text-sm">Skills:</span>
                    {job.skills.map(skill => (
                        <span key={skill} className="bg-blue-100 text-blue-800 text-xs font-medium px-5.5 py-5.5 rounded-full">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
            <button onClick={() => onApplyNow(job)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">
                Apply Now
            </button>
        </div>
    );
};

const ApplicationForm = ({ job, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        coverLetter: ''
    });
    const [resume, setResume] = useState(null);
    const [message, setMessage] = useState('');

    const { fullName, email, phone, coverLetter } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const onFileChange = e => setResume(e.target.files[0]);

    const onSubmit = async e => {
        e.preventDefault();
        if (!resume) {
            setMessage('Please upload your resume.');
            return;
        }

        const applicationData = new FormData();
        applicationData.append('jobId', job._id);
        applicationData.append('fullName', fullName);
        applicationData.append('email', email);
        applicationData.append('phone', phone);
        applicationData.append('coverLetter', coverLetter);
        applicationData.append('resume', resume);

        try {
            await axios.post('http://localhost:5000/api/applications', applicationData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('Application submitted successfully!');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            setMessage(err.response?.data?.msg || 'Application failed.');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700">Apply for {job.jobTitle}</h2>
            <p className="text-gray-600 mb-4">{job.companyName}</p>
            <form onSubmit={onSubmit} className="space-y-4">
                <InputField label="Full Name" name="fullName" value={fullName} onChange={onChange} placeholder="Enter your full name" />
                <InputField label="Email" name="email" type="email" value={email} onChange={onChange} placeholder="Enter your email" />
                <InputField label="Phone" name="phone" value={phone} onChange={onChange} placeholder="Enter your phone number" />
                <div>
                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">Cover Letter (Optional)</label>
                    <textarea name="coverLetter" value={coverLetter} onChange={onChange} rows="4" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Upload Resume</label>
                    <input type="file" name="resume" onChange={onFileChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                </div>
                <div className="flex items-center space-x-4">
                    <button type="submit" className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">Submit Application</button>
                    <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
            </form>
            {message && <p className="mt-4 text-center">{message}</p>}
        </div>
    );
};
