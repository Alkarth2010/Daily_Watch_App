import React, { useState, useEffect, useRef } from 'react';

// Main App component
function App() {
  // State to store all tasks
  const [tasks, setTasks] = useState([]);
  // State for the new project name input field
  const [newProjectName, setNewProjectName] = useState('');
  // State to keep track of the ID of the task whose timer is currently running
  const [runningTaskId, setRunningTaskId] = useState(null);
  // State for the overall accumulated time
  const [overallTime, setOverallTime] = useState(0);

  // Ref to store the interval ID for the currently running timer
  const intervalRef = useRef(null);
  // Ref to store the interval ID for the overall timer
  const overallIntervalRef = useRef(null);

  // Effect hook to handle the overall timer
  useEffect(() => {
    // If a task timer is running, start the overall timer
    if (runningTaskId !== null) {
      // Clear any existing overall timer to prevent multiple intervals
      if (overallIntervalRef.current) {
        clearInterval(overallIntervalRef.current);
      }
      // Set a new interval for the overall timer, updating every second
      overallIntervalRef.current = setInterval(() => {
        setOverallTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      // If no task timer is running, clear the overall timer
      if (overallIntervalRef.current) {
        clearInterval(overallIntervalRef.current);
        overallIntervalRef.current = null;
      }
    }

    // Cleanup function to clear the overall interval when the component unmounts
    return () => {
      if (overallIntervalRef.current) {
        clearInterval(overallIntervalRef.current);
      }
    };
  }, [runningTaskId]); // Re-run this effect when runningTaskId changes

  // Function to format time from seconds into HH:MM:SS format
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Pad with leading zeros if necessary
    return [hours, minutes, seconds]
      .map(v => v < 10 ? '0' + v : v)
      .join(':');
  };

  // Function to add a new task
  const addTask = () => {
    if (newProjectName.trim() === '') {
      // Simple validation to ensure project name is not empty
      alert('Project Name cannot be empty.'); // Using alert for simplicity, consider a custom modal for better UX
      return;
    }

    // Create a new task object
    const newTask = {
      id: Date.now(), // Unique ID for the task
      sno: tasks.length + 1, // Serial number, increments automatically
      projectName: newProjectName,
      type: 'Data Processing', // Default type
      timeSpent: 0, // Initial time spent
      etHrs: '', // Estimated hours
      atHrs: '', // Actual hours
    };

    // Add the new task to the tasks array
    setTasks([...tasks, newTask]);
    // Clear the project name input field
    setNewProjectName('');
  };

  // Function to handle starting/stopping a task's timer
  const toggleTimer = (taskId) => {
    // If a timer is already running for this task, stop it
    if (runningTaskId === taskId) {
      clearInterval(intervalRef.current); // Clear the interval
      intervalRef.current = null; // Reset the ref
      setRunningTaskId(null); // No task is running
    } else {
      // If another timer is running, stop it first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set the new running task ID
      setRunningTaskId(taskId);

      // Start the interval for the selected task
      intervalRef.current = setInterval(() => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, timeSpent: task.timeSpent + 1 } : task
          )
        );
      }, 1000); // Update every second
    }
  };

  // Function to stop all timers
  const stopAllTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunningTaskId(null); // No task is running
  };

  // Function to reset all 'Time Spent' values to 0
  const resetAllTimes = () => {
    stopAllTimers(); // Stop any running timers first
    setTasks(prevTasks =>
      prevTasks.map(task => ({ ...task, timeSpent: 0 }))
    );
    setOverallTime(0); // Reset overall time as well
  };

  // Function to clear all tasks and reset the app
  const clearAllEntries = () => {
    stopAllTimers(); // Stop any running timers
    setTasks([]); // Clear all tasks
    setOverallTime(0); // Reset overall time
    setNewProjectName(''); // Clear project name input
  };

  // Function to export data as CSV
  const exportDataAsCsv = () => {
    // Define CSV header
    const headers = ['S.no', 'Project Name', 'Type', 'Time Spent (HH:MM:SS)', 'ET Hrs', 'AT Hrs'];
    // Map tasks data to CSV rows, formatting time spent
    const csvRows = tasks.map(task => [
      task.sno,
      `"${task.projectName.replace(/"/g, '""')}"`, // Handle commas and quotes in project name
      task.type,
      formatTime(task.timeSpent),
      task.etHrs,
      task.atHrs,
    ].join(','));

    // Combine header and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'task_data.csv'); // Set the download file name
    document.body.appendChild(link); // Append to body
    link.click(); // Programmatically click the link to trigger download
    document.body.removeChild(link); // Remove the link
    URL.revokeObjectURL(url); // Revoke the object URL to free up memory
  };

  // Function to handle changes in the Type dropdown
  const handleTypeChange = (taskId, newType) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, type: newType } : task
      )
    );
  };

  // Function to handle changes in ET Hrs or AT Hrs input fields
  const handleHoursChange = (taskId, field, value) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 font-inter">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8 drop-shadow-md">
          Daily Watch
        </h1>

        {/* Container for Add Task and Overall Stopwatch, side-by-side on larger screens */}
        <div className="flex flex-col md:flex-row md:justify-between items-center gap-6 mb-8">
          {/* Add Task Section */}
          <div className="w-full md:w-1/2 flex flex-col md:flex-row items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg shadow-inner">
            <input
              type="text"
              className="flex-grow p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm"
              placeholder="Enter Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button
              onClick={addTask}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Task
            </button>
          </div>

          {/* Overall Stopwatch Display */}
          <div className="w-full md:w-1/2 text-center p-4 bg-green-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-green-800 mb-2">Overall Time Spent</h2>
            <div className="text-5xl font-mono text-green-700 bg-green-100 p-4 rounded-lg inline-block shadow-md">
              {formatTime(overallTime)}
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-x-auto mb-8 shadow-lg rounded-lg border border-gray-200">
          <table className="min-w-full bg-white border-collapse">
            <thead className="bg-gray-600 text-white"><tr>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">S.no</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider w-2/5">Project Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Action</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">Time Spent</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">ET Hrs</th>
                <th className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">AT Hrs</th>
              </tr></thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500 text-lg">
                    No tasks added yet. Start by entering a project name!
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50 transition duration-150 ease-in-out">
                    <td className="py-3 px-4 text-sm text-gray-800">{task.sno}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium w-2/5">{task.projectName}</td>
                    <td className="py-3 px-4 text-sm">
                      <select
                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white shadow-sm"
                        value={task.type}
                        onChange={(e) => handleTypeChange(task.id, e.target.value)}
                      >
                        <option value="Data Processing">Data Processing</option>
                        <option value="Tables Scripting">Tables Scripting</option>
                        <option value="Advanced analysis">Advanced analysis</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => toggleTimer(task.id)}
                        className={`px-4 py-2 rounded-md font-semibold text-white transition duration-300 ease-in-out transform hover:scale-105 ${
                          runningTaskId === task.id
                            ? 'bg-red-500 hover:bg-red-600 shadow-md'
                            : 'bg-green-500 hover:bg-green-600 shadow-md'
                        }`}
                      >
                        {runningTaskId === task.id ? 'Stop' : 'Start'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-700">
                      {formatTime(task.timeSpent)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <input
                        type="number"
                        className="w-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 shadow-sm"
                        value={task.etHrs}
                        onChange={(e) => handleHoursChange(task.id, 'etHrs', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <input
                        type="number"
                        className="w-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 shadow-sm"
                        value={task.atHrs}
                        onChange={(e) => handleHoursChange(task.id, 'atHrs', e.target.value)}
                        min="0"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={stopAllTimers}
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          >
            Stop Timer
          </button>
          <button
            onClick={resetAllTimes}
            className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
          >
            Reset All Times
          </button>
          <button
            onClick={exportDataAsCsv}
            className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
          >
            Export Data (CSV)
          </button>
          <button
            onClick={clearAllEntries}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
