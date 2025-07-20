document.addEventListener('DOMContentLoaded', function() {
            // State management
            const state = {
                currentDate: new Date(),
                entries: JSON.parse(localStorage.getItem('diaryEntries')) || [],
                locked: localStorage.getItem('diaryLocked') === 'true',
                password: localStorage.getItem('diaryPassword') || '1234' // Default password for demo
            };
            
            // DOM Elements
            const elements = {
                currentMonthYear: document.getElementById('currentMonthYear'),
                calendarDays: document.getElementById('calendarDays'),
                prevMonthBtn: document.getElementById('prevMonthBtn'),
                nextMonthBtn: document.getElementById('nextMonthBtn'),
                editorView: document.getElementById('editorView'),
                entriesView: document.getElementById('entriesView'),
                entryDate: document.getElementById('entryDate'),
                entryContent: document.getElementById('entryContent'),
                saveEntryBtn: document.getElementById('saveEntryBtn'),
                cancelEditBtn: document.getElementById('cancelEditBtn'),
                newEntryBtn: document.getElementById('newEntryBtn'),
                entriesList: document.getElementById('entriesList'),
                toggleLockBtn: document.getElementById('toggleLockBtn'),
                lockScreen: document.getElementById('lockScreen'),
                passwordInput: document.getElementById('passwordInput'),
                unlockBtn: document.getElementById('unlockBtn'),
                passwordError: document.getElementById('passwordError'),
                entryModal: document.getElementById('entryModal'),
                modalEntryDate: document.getElementById('modalEntryDate'),
                modalEntryContent: document.getElementById('modalEntryContent'),
                closeModalBtn: document.getElementById('closeModalBtn'),
                editEntryBtn: document.getElementById('editEntryBtn'),
                deleteEntryBtn: document.getElementById('deleteEntryBtn'),
                moodChartBtn: document.getElementById('moodChartBtn'),
    moodChartView: document.getElementById('moodChartView'),
    moodModal: document.getElementById('moodModal')
            };
            
            // Mood tracking state
            const moodTracker = {
                moods: JSON.parse(localStorage.getItem('moodTracker')) || [],
                currentView: 'entries', // 'entries' or 'mood'
                chart: null
            };

            const moodBoard = {
    moods: JSON.parse(localStorage.getItem('moodBoard')) || []
};
            // Initialize the app
            function init() {
                // Check if we have a password set
                if (localStorage.getItem('diaryPassword')) {
                    // Show login screen
                    document.getElementById('homepage').classList.remove('hidden');
                    document.getElementById('diaryContent').classList.add('hidden');
                    
                    // Focus password field
                    document.getElementById('loginPassword').focus();
                    
                    // Login button event
                    document.getElementById('loginBtn').addEventListener('click', handleLogin);
                    
                    // Allow login on Enter key
                    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleLogin();
                        }
                    });
                } else {
                    // First time user, show diary directly
                    document.getElementById('homepage').classList.add('hidden');
                    document.getElementById('diaryContent').classList.remove('hidden');
                    renderCalendar();
                    renderEntriesList();
                    checkLockState();
                }
                
                // Event listeners
                elements.prevMonthBtn.addEventListener('click', () => {
                    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
                    renderCalendar();
                });
                
                elements.nextMonthBtn.addEventListener('click', () => {
                    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
                    renderCalendar();
                });
                
                elements.saveEntryBtn.addEventListener('click', saveEntry);
                elements.cancelEditBtn.addEventListener('click', cancelEdit);
                elements.newEntryBtn.addEventListener('click', newEntry);
                elements.toggleLockBtn.addEventListener('click', toggleLock);
                elements.unlockBtn.addEventListener('click', unlockDiary);
                elements.closeModalBtn.addEventListener('click', closeModal);
                elements.editEntryBtn.addEventListener('click', editModalEntry);
                elements.deleteEntryBtn.addEventListener('click', deleteModalEntry);
                
                // Mood chart events
                elements.moodChartBtn.addEventListener('click', toggleMoodChart);
                document.querySelectorAll('.mood-emoji-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const moodValue = parseInt(btn.dataset.mood);
                        recordMood(moodValue);
                    });
                });
                
                elements.saveMoodBtn.addEventListener('click', saveCustomMood);
                elements.cancelMoodBtn.addEventListener('click', hideMoodModal);
                
                // Password input - allow unlock on Enter key
                elements.passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        unlockDiary();
                    }
                });
            }
            
            // Calendar functions
            function renderCalendar() {
                const year = state.currentDate.getFullYear();
                const month = state.currentDate.getMonth();
                
                // Update month/year display
                elements.currentMonthYear.textContent = new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    year: 'numeric'
                }).format(state.currentDate);
                
                // Get first day of month and total days in month
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                // Get days from previous month to display
                const prevMonthDays = new Date(year, month, 0).getDate();
                
                // Clear calendar
                elements.calendarDays.innerHTML = '';
                
                // Previous month's days
                for (let i = firstDay - 1; i >= 0; i--) {
                    const dayElement = createDayElement(prevMonthDays - i, true);
                    elements.calendarDays.appendChild(dayElement);
                }
                
                // Current month's days
                for (let i = 1; i <= daysInMonth; i++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    const hasEntry = state.entries.some(entry => entry.date === dateStr);
                    
                    const dayElement = createDayElement(i, false, hasEntry);
                    dayElement.addEventListener('click', () => openEntryForDate(dateStr));
                    elements.calendarDays.appendChild(dayElement);
                }
                
                // Next month's days (to fill the grid)
                const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
                const nextMonthDays = totalCells - (firstDay + daysInMonth);
                
                for (let i = 1; i <= nextMonthDays; i++) {
                    const dayElement = createDayElement(i, true);
                    elements.calendarDays.appendChild(dayElement);
                }
            }
            
            function createDayElement(day, isOtherMonth, hasEntry = false) {
                const dayElement = document.createElement('div');
                dayElement.className = `calendar-day text-center p-2 rounded-full cursor-pointer ${isOtherMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-blue-100'} ${hasEntry ? 'has-entry font-bold' : ''}`;
                dayElement.textContent = day;
                
                if (hasEntry) {
                    dayElement.innerHTML += ' <i class="fas fa-pencil-alt text-xs"></i>';
                }
                
                return dayElement;
            }
            
            // Entry management
            function newEntry() {
                if (state.locked) {
                    showLockScreen();
                    return;
                }
                
                const today = new Date().toISOString().split('T')[0];
                elements.entryDate.value = today;
                elements.entryContent.value = '';
                
                showEditor();
            }
            
            function openEntryForDate(dateStr) {
                if (state.locked) {
                    showLockScreen();
                    return;
                }
                
                const entry = state.entries.find(entry => entry.date === dateStr);
                
                if (entry) {
                    // Show entry in modal
                    elements.modalEntryDate.textContent = formatDateForDisplay(entry.date);
                    elements.modalEntryContent.innerHTML = entry.content.replace(/\n/g, '<br>');
                    
                    // Store current entry date for editing/deleting
                    elements.modalEntryDate.dataset.date = entry.date;
                    
                    elements.entryModal.classList.remove('hidden');
                } else {
                    // Create new entry for this date
                    elements.entryDate.value = dateStr;
                    elements.entryContent.value = '';
                    showEditor();
                }
            }
            
            function saveEntry() {
                const date = elements.entryDate.value;
                const content = elements.entryContent.value.trim();
                
                if (!content) {
                    alert("Entry cannot be empty!");
                    return;
                }
                
                // Check if entry already exists for this date
                const existingIndex = state.entries.findIndex(entry => entry.date === date);
                
                if (existingIndex >= 0) {
                    // Update existing entry
                    state.entries[existingIndex].content = content;
                } else {
                    // Add new entry
                    state.entries.push({ date, content });
                }
                
                // Sort entries by date (newest first)
                state.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Save to localStorage
                localStorage.setItem('diaryEntries', JSON.stringify(state.entries));
                
                // Update UI
                renderCalendar();
                renderEntriesList();
                showEntriesView();
            }
            
            function cancelEdit() {
                showEntriesView();
            }
            
            function editModalEntry() {
                const date = elements.modalEntryDate.dataset.date;
                const entry = state.entries.find(entry => entry.date === date);
                
                if (entry) {
                    elements.entryDate.value = entry.date;
                    elements.entryContent.value = entry.content;
                    
                    closeModal();
                    showEditor();
                }
            }
            
            function deleteModalEntry() {
                if (confirm("Are you sure you want to delete this entry?")) {
                    const date = elements.modalEntryDate.dataset.date;
                    state.entries = state.entries.filter(entry => entry.date !== date);
                    
                    // Save to localStorage
                    localStorage.setItem('diaryEntries', JSON.stringify(state.entries));
                    
                    // Update UI
                    renderCalendar();
                    renderEntriesList();
                    closeModal();
                }
            }
            
            function closeModal() {
                elements.entryModal.classList.add('hidden');
            }
            
            // View management
            function showEditor() {
                elements.editorView.classList.remove('hidden');
                elements.entriesView.classList.add('hidden');
                elements.entryContent.focus();
            }
            
            function showEntriesView() {
                elements.editorView.classList.add('hidden');
                elements.entriesView.classList.remove('hidden');
            }
            
            function renderEntriesList() {
                if (state.entries.length === 0) {
                    elements.entriesList.innerHTML = `
                        <div class="text-center py-10 text-gray-400">
                            <i class="fas fa-book-open text-4xl mb-2"></i>
                            <p>No entries yet. Click "New Entry" to start writing!</p>
                        </div>
                    `;
                    return;
                }
                
                elements.entriesList.innerHTML = state.entries.map(entry => `
                    <div class="entry-item p-4 mb-3 rounded-lg bg-gradient-to-r from-pink-50 to-blue-50 border border-gray-100 cursor-pointer hover:shadow-md transition" data-date="${entry.date}">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-lg font-medium text-gray-700">${formatDateForDisplay(entry.date)}</h3>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </div>
                        <p class="text-gray-600 truncate">${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}</p>
                    </div>
                `).join('');
                
                // Add click event to each entry
                document.querySelectorAll('.entry-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const date = item.dataset.date;
                        openEntryForDate(date);
                    });
                });
            }
            
            // Lock functions
            function checkLockState() {
                if (state.locked) {
                    elements.toggleLockBtn.innerHTML = '<i class="fas fa-lock-open mr-2"></i> Unlock Diary';
                    elements.toggleLockBtn.className = 'px-4 py-2 rounded-full bg-green-200 text-green-700 hover:bg-green-300 transition';
                } else {
                    elements.toggleLockBtn.innerHTML = '<i class="fas fa-lock mr-2"></i> Lock Diary';
                    elements.toggleLockBtn.className = 'px-4 py-2 rounded-full bg-pink-200 text-pink-700 hover:bg-pink-300 transition';
                }
            }
            
            function toggleLock() {
                if (state.locked) {
                    // Unlock
                    state.locked = false;
                    localStorage.setItem('diaryLocked', 'false');
                } else {
                    // Lock
                    const newPassword = prompt("Set a password for your diary:");
                    if (newPassword) {
                        state.password = newPassword;
                        state.locked = true;
                        localStorage.setItem('diaryLocked', 'true');
                        localStorage.setItem('diaryPassword', newPassword);
                    }
                }
                
                checkLockState();
            }
            
            function showLockScreen() {
                elements.lockScreen.classList.remove('hidden');
                elements.passwordInput.focus();
                elements.passwordError.classList.add('hidden');
            }
            
            function hideLockScreen() {
                elements.lockScreen.classList.add('hidden');
                elements.passwordInput.value = '';
            }
            
            function unlockDiary() {
                if (elements.passwordInput.value === state.password) {
                    state.locked = false;
                    localStorage.setItem('diaryLocked', 'false');
                    checkLockState();
                    hideLockScreen();
                } else {
                    elements.passwordError.classList.remove('hidden');
                    elements.passwordInput.focus();
                }
            }
            
            // Login function
            function handleLogin() {
                const passwordInput = document.getElementById('loginPassword');
                const userNameInput = document.getElementById('userName');
                const loginError = document.getElementById('loginError');
                
                if (passwordInput.value === state.password) {
                    // Save user name if provided
                    if (userNameInput.value.trim()) {
                        localStorage.setItem('diaryUserName', userNameInput.value.trim());
                    }
                    
                    // Hide homepage and show diary
                    document.getElementById('homepage').classList.add('hidden');
                    document.getElementById('diaryContent').classList.remove('hidden');
                    
                    // Initialize diary
                    renderCalendar();
                    renderEntriesList();
                    checkLockState();
                } else {
                    loginError.classList.remove('hidden');
                    passwordInput.focus();
                }
            }
            
            // Helper functions
            function formatDateForDisplay(dateStr) {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            // Mood board functions
            function toggleMoodChart() {
                if (moodTracker.currentView === 'entries') {
                    elements.entriesView.classList.add('hidden');
                    elements.moodChartView.classList.remove('hidden');
                    elements.moodChartBtn.classList.add('bg-purple-300');
                    moodTracker.currentView = 'mood';
                    renderMoodChart();
                } else {
                    elements.entriesView.classList.remove('hidden');
                    elements.moodChartView.classList.add('hidden');
                    elements.moodChartBtn.classList.remove('bg-purple-300');
                    moodTracker.currentView = 'entries';
                }
            }

            function recordMood(value) {
                const today = new Date().toISOString().split('T')[0];
                
                // Remove selection from all buttons
                document.querySelectorAll('.mood-emoji-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Add selection to clicked button
                const clickedBtn = document.querySelector(`.mood-emoji-btn[data-mood="${value}"]`);
                clickedBtn.classList.add('selected');
                
                // Check if mood already recorded today
                const existingIndex = moodTracker.moods.findIndex(m => m.date === today);
                
                if (existingIndex >= 0) {
                    // Update existing mood
                    moodTracker.moods[existingIndex].value = value;
                } else {
                    // Add new mood record
                    moodTracker.moods.push({
                        date: today,
                        value: value
                    });
                }
                
                // Sort by date (newest first)
                moodTracker.moods.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Save to localStorage
                localStorage.setItem('moodTracker', JSON.stringify(moodTracker.moods));
                
                // Update chart
                renderMoodChart();
                
                // Show visual feedback
                const feedback = document.getElementById('moodFeedback');
                feedback.textContent = `${getMoodDescription(value)} mood recorded!`;
                feedback.classList.remove('hidden');
                
                // Hide feedback after 3 seconds
                setTimeout(() => {
                    feedback.classList.add('hidden');
                }, 3000);
            }

            function getMoodDescription(value) {
                const descriptions = {
                    1: 'Awful',
                    2: 'Sad',
                    3: 'Neutral',
                    4: 'Happy',
                    5: 'Ecstatic'
                };
                return descriptions[value] || '';
            }

            function renderMoodChart() {
                const ctx = document.getElementById('moodChart').getContext('2d');
                
                // Get last 7 days of data (most recent first)
                const recentMoods = moodTracker.moods.slice(0, 7).reverse();
                
                // Destroy previous chart if exists
                if (moodTracker.chart) {
                    moodTracker.chart.destroy();
                }
                
                moodTracker.chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: recentMoods.map(m => formatShortDate(m.date)),
                        datasets: [{
                            label: 'Mood',
                            data: recentMoods.map(m => m.value),
                            backgroundColor: 'rgba(168, 85, 247, 0.2)',
                            borderColor: 'rgba(168, 85, 247, 1)',
                            borderWidth: 2,
                            tension: 0.3,
                            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                            pointRadius: 5
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: 1,
                                max: 5,
                                ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                        return getMoodDescription(value);
                                    }
                                }
                            }
                        },
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }

            function formatShortDate(dateStr) {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }

            function showMoodModal() {
                elements.moodModal.classList.remove('hidden');
            }

            function hideMoodModal() {
                elements.moodModal.classList.add('hidden');
                document.getElementById('moodName').value = '';
            }

            function saveCustomMood() {
                const name = document.getElementById('moodName').value.trim();
                const icon = document.getElementById('moodIcon').value;
                const color = document.getElementById('moodColor').value;
                
                if (!name) {
                    alert('Please enter a mood name');
                    return;
                }
                
                // Add to mood board
                moodBoard.moods.push({ name, icon, color });
                localStorage.setItem('moodBoard', JSON.stringify(moodBoard.moods));
                
                // Update UI
                renderMoodBoard();
                hideMoodModal();
            }

            function renderMoodBoard() {
                // Render custom moods here
                // You would need to update the mood board grid with custom moods
            }

            // Initialize the app
            init();
        });