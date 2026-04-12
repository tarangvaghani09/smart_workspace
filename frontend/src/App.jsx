import React, { useState } from 'react';
import { apiUrl } from './api';

function App() {
    const [title, setTitle] = useState('');
    const [roomId, setRoomId] = useState(1);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Submit booking request
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Convert IST to UTC (backend-safe)
        const startUTC = new Date(`${date}T${startTime}:00+05:30`).toISOString();
        const endUTC = new Date(`${date}T${endTime}:00+05:30`).toISOString();

        try {
            const res = await fetch(apiUrl('/api/bookings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, roomId, startTime: startUTC, endTime: endUTC })
            });

            if (!res.ok) throw new Error();

            setMessage('✅ Booking created successfully');
            setTitle('');
            setRoomId(1);
            setDate('');
            setStartTime('');
            setEndTime('');
        } catch {
            setMessage('❌ Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        📅 Book a Conference Room
                    </h2>
                    <p className="text-indigo-100 mt-1">Schedule your next meeting effortlessly.</p>
                </div>

                <div className="p-8">
                    {/* Booking Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                            {/* Title Section */}
                            <div className="sm:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">✎</span>
                                    </div>
                                    <input
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-8 py-3 sm:text-sm border-gray-300 rounded-lg border"
                                        placeholder="e.g. Q4 Strategy Review"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Room ID Section */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
                                <input
                                    type="number"
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-3 px-4 sm:text-sm border-gray-300 rounded-lg border"
                                    value={roomId}
                                    onChange={(e) => setRoomId(Number(e.target.value))}
                                    required
                                    min="1"
                                />
                            </div>

                            {/* Date Section */}
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date (IST)</label>
                                <input
                                    type="date"
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full py-3 px-4 sm:text-sm border-gray-300 rounded-lg border"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Time Range Section */}
                            <div className="sm:col-span-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Time Slot</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Start</label>
                                        <input
                                            type="time"
                                            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">End</label>
                                        <input
                                            type="time"
                                            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition-colors duration-200"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing Booking...
                                    </span>
                                ) : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>

                    {/* Status Message */}
                    {message && (
                        <div className={`mt-6 p-4 rounded-lg flex items-center justify-center ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            <p className="font-medium">
                                {message}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
