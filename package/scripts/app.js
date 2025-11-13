// App State Management
class ExerciseTracker {
    constructor() {
        this.exercises = this.loadFromStorage();
        this.currentPage = 'dashboard';
        this.filters = {
            startDate: '',
            endDate: '',
            exerciseName: ''
        };
        
        // Timer state
        this.timer = {
            isRunning: false,
            timeLeft: 0,
            totalTime: 0,
            interval: null
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTimerEventListeners();
        this.setCurrentDateTime();
        this.loadDashboard();
        this.populateExerciseFilters();
        this.updateStatsFilters();
        this.renderExerciseList();
        this.updateProgressChart();
        this.updateComparisonChart();
        this.setupWorkoutPlanTabs();
    }

    // Storage Management
    loadFromStorage() {
        const data = localStorage.getItem('gym-exercises');
        return data ? JSON.parse(data) : [];
    }

    saveToStorage() {
        localStorage.setItem('gym-exercises', JSON.stringify(this.exercises));
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Form submission
        document.getElementById('exercise-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExercise();
        });

        // Session change handler
        document.getElementById('exercise-session').addEventListener('change', (e) => {
            this.handleSessionChange(e.target.value);
        });

        // Filter events
        document.getElementById('filter-start-date').addEventListener('change', () => {
            this.filters.startDate = document.getElementById('filter-start-date').value;
        });

        document.getElementById('filter-end-date').addEventListener('change', () => {
            this.filters.endDate = document.getElementById('filter-end-date').value;
        });

        document.getElementById('filter-exercise').addEventListener('change', () => {
            this.filters.exerciseName = document.getElementById('filter-exercise').value;
        });

        // Modal close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setupTimerEventListeners() {
        document.getElementById('timer-minutes').addEventListener('change', (e) => {
            if (!this.timer.isRunning) {
                this.updateTimerDisplay();
            }
        });

        document.getElementById('timer-seconds').addEventListener('change', (e) => {
            if (!this.timer.isRunning) {
                this.updateTimerDisplay();
            }
        });
    }

    setupWorkoutPlanTabs() {
        document.querySelectorAll('.session-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const session = e.currentTarget.dataset.session;
                this.showWorkoutPlanSession(session);
            });
        });
    }

    // Navigation
    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        document.getElementById(`${pageName}-page`).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        this.currentPage = pageName;

        // Page-specific updates
        switch (pageName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'workout-plan':
                this.loadWorkoutPlan();
                break;
            case 'timer':
                this.loadTimer();
                break;
            case 'history':
                this.renderExerciseList();
                break;
            case 'stats':
                this.updateProgressChart();
                this.updateComparisonChart();
                this.renderSummaryStats();
                break;
        }
    }

    showWorkoutPlanSession(session) {
        // Hide all sessions
        document.querySelectorAll('.session-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show target session
        document.getElementById(`session-${session}`).classList.add('active');

        // Update tabs
        document.querySelectorAll('.session-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-session="${session}"]`).classList.add('active');
    }

    // Dashboard
    loadDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const todayExercises = this.exercises.filter(ex => ex.date === today);
        
        // Update stats
        document.getElementById('today-exercises').textContent = todayExercises.length;
        document.getElementById('total-exercises').textContent = this.exercises.length;
        
        const todayWeight = todayExercises.reduce((sum, ex) => sum + (ex.weight * ex.sets * ex.reps), 0);
        document.getElementById('today-weight').textContent = `${todayWeight.toFixed(1)} کیلوگرم`;
        
        if (this.exercises.length > 0) {
            const bestExercise = this.getBestExercise();
            document.getElementById('best-exercise').textContent = bestExercise.name;
        } else {
            document.getElementById('best-exercise').textContent = '-';
        }

        // Show today's exercises
        this.renderTodayExercises(todayExercises);
    }

    renderTodayExercises(exercises) {
        const container = document.getElementById('today-exercises-list');
        
        if (exercises.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>تمرینی امروز ثبت نشده</h3>
                    <p>اولین تمرین امروز خود را اضافه کنید</p>
                </div>
            `;
            return;
        }

        const sortedExercises = exercises.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        container.innerHTML = sortedExercises.slice(0, 5).map(exercise => this.createExerciseCard(exercise)).join('');
    }

    getBestExercise() {
        return this.exercises.reduce((best, current) => {
            const bestVolume = best.weight * best.sets * best.reps;
            const currentVolume = current.weight * current.sets * current.reps;
            return currentVolume > bestVolume ? current : best;
        });
    }

    // Session Handling
    handleSessionChange(session) {
        const exerciseSelect = document.getElementById('exercise-name');
        const options = exerciseSelect.querySelectorAll('option');
        
        // Show all options first
        options.forEach(option => {
            option.style.display = '';
        });

        // Filter by session
        if (session) {
            options.forEach(option => {
                if (option.dataset.session && option.dataset.session !== session) {
                    option.style.display = 'none';
                }
                if (option.dataset.session === session || !option.dataset.session) {
                    option.style.display = '';
                }
            });
        }

        // Reset exercise selection
        exerciseSelect.value = '';
        exerciseSelect.firstElementChild.textContent = 'انتخاب کنید';
    }

    addExerciseToPlan(exerciseName, session) {
        this.showPage('add-exercise');
        
        // Set session
        document.getElementById('exercise-session').value = session;
        this.handleSessionChange(session);
        
        // Set exercise
        document.getElementById('exercise-name').value = exerciseName;
    }

    // Exercise Management
    addExercise() {
        const form = document.getElementById('exercise-form');
        const formData = new FormData(form);
        
        const exercise = {
            id: Date.now(),
            session: formData.get('session'),
            name: formData.get('name'),
            date: formData.get('date'),
            time: formData.get('time'),
            dateTime: `${formData.get('date')}T${formData.get('time')}`,
            weight: parseFloat(formData.get('weight')),
            sets: parseInt(formData.get('sets')),
            reps: parseInt(formData.get('reps')),
            notes: formData.get('notes') || '',
            createdAt: new Date().toISOString()
        };

        // Validation
        if (!exercise.session || !exercise.name || !exercise.date || !exercise.time) {
            this.showToast('لطفاً تمام فیلدهای ضروری را پر کنید', 'error');
            return;
        }

        if (exercise.weight <= 0 || exercise.sets <= 0 || exercise.reps <= 0) {
            this.showToast('مقادیر باید بیشتر از صفر باشند', 'error');
            return;
        }

        this.exercises.push(exercise);
        this.saveToStorage();
        
        this.showToast('تمرین با موفقیت ذخیره شد', 'success');
        this.clearForm();
        this.loadDashboard();
        this.populateExerciseFilters();
        this.updateStatsFilters();
        
        // Return to dashboard
        this.showPage('dashboard');
    }

    editExercise(exerciseId) {
        const exercise = this.exercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;

        // Define all exercises with their sessions
        const exercises = {
            'A': [
                'اسکات پا (هالتر)', 'پرس سینه هالتر', 'پارویی هالتر', 
                'سربازی دمبل نشسته', 'جلو بازو هالتر', 'کشش صورت'
            ],
            'B': [
                'ددلیفت رومانیایی', 'پرس سرشانه هالتر', 'زیربغل کش', 
                'پرس سینه شیبدار', 'پشت بازو دمبل', 'پارویی با حمایت سینه'
            ],
            'C': [
                'لنگ دمبل', 'پرس سینه دمبل', 'پارویی دمبل تک‌دست', 
                'رفرف جانبی', 'هامر کرل', 'پل باسن'
            ]
        };

        let sessionOptions = '';
        Object.keys(exercises).forEach(session => {
            exercises[session].forEach(ex => {
                const selected = exercise.name === ex && exercise.session === session ? 'selected' : '';
                const disabled = exercise.session !== session ? 'disabled' : '';
                sessionOptions += `<option value="${ex}" ${selected} ${disabled}>${ex}</option>`;
            });
        });

        const modalContent = `
            <form id="edit-exercise-form">
                <div class="form-group">
                    <label for="edit-session" class="form-label">جلسه</label>
                    <select id="edit-session" name="session" class="form-select" required>
                        <option value="A" ${exercise.session === 'A' ? 'selected' : ''}>جلسه A</option>
                        <option value="B" ${exercise.session === 'B' ? 'selected' : ''}>جلسه B</option>
                        <option value="C" ${exercise.session === 'C' ? 'selected' : ''}>جلسه C</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="edit-name" class="form-label">نام تمرین</label>
                    <select id="edit-name" name="name" class="form-select" required>
                        ${sessionOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label for="edit-date" class="form-label">تاریخ</label>
                    <input type="date" id="edit-date" name="date" class="form-input" value="${exercise.date}" required>
                </div>

                <div class="form-group">
                    <label for="edit-time" class="form-label">زمان</label>
                    <input type="time" id="edit-time" name="time" class="form-input" value="${exercise.time}" required>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-weight" class="form-label">وزن (کیلوگرم)</label>
                        <input type="number" id="edit-weight" name="weight" class="form-input" 
                               value="${exercise.weight}" min="0" step="0.5" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-sets" class="form-label">تعداد ست</label>
                        <input type="number" id="edit-sets" name="sets" class="form-input" 
                               value="${exercise.sets}" min="1" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-reps" class="form-label">تعداد تکرار</label>
                        <input type="number" id="edit-reps" name="reps" class="form-input" 
                               value="${exercise.reps}" min="1" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-notes" class="form-label">توضیحات</label>
                    <textarea id="edit-notes" name="notes" class="form-textarea">${exercise.notes}</textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="tracker.closeModal()">لغو</button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i>
                        ذخیره تغییرات
                    </button>
                </div>
            </form>
        `;

        document.getElementById('modal-content').innerHTML = modalContent;
        document.getElementById('modal-title').textContent = 'ویرایش تمرین';
        document.getElementById('modal-overlay').classList.add('active');

        // Handle form submission
        document.getElementById('edit-exercise-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateExercise(exerciseId);
        });
    }

    updateExercise(exerciseId) {
        const form = document.getElementById('edit-exercise-form');
        const formData = new FormData(form);
        
        const index = this.exercises.findIndex(ex => ex.id === exerciseId);
        if (index === -1) return;

        this.exercises[index] = {
            ...this.exercises[index],
            session: formData.get('session'),
            name: formData.get('name'),
            date: formData.get('date'),
            time: formData.get('time'),
            dateTime: `${formData.get('date')}T${formData.get('time')}`,
            weight: parseFloat(formData.get('weight')),
            sets: parseInt(formData.get('sets')),
            reps: parseInt(formData.get('reps')),
            notes: formData.get('notes') || '',
            updatedAt: new Date().toISOString()
        };

        this.saveToStorage();
        this.closeModal();
        this.loadDashboard();
        this.populateExerciseFilters();
        this.updateStatsFilters();
        this.renderExerciseList();
        this.updateProgressChart();
        this.updateComparisonChart();
        this.showToast('تمرین با موفقیت به‌روزرسانی شد', 'success');
    }

    deleteExercise(exerciseId) {
        if (confirm('آیا مطمئن هستید که می‌خواهید این تمرین را حذف کنید؟')) {
            this.exercises = this.exercises.filter(ex => ex.id !== exerciseId);
            this.saveToStorage();
            this.loadDashboard();
            this.populateExerciseFilters();
            this.updateStatsFilters();
            this.renderExerciseList();
            this.updateProgressChart();
            this.updateComparisonChart();
            this.showToast('تمرین حذف شد', 'success');
        }
    }

    // Timer Functions
    loadTimer() {
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
        const totalSeconds = minutes * 60 + seconds;
        
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        
        document.getElementById('timer-display').textContent = 
            `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        
        // Update progress
        const progress = this.timer.totalTime > 0 ? 
            ((this.timer.totalTime - this.timer.timeLeft) / this.timer.totalTime) * 100 : 0;
        document.getElementById('timer-progress').style.width = `${progress}%`;
    }

    startTimer() {
        if (this.timer.isRunning) return;

        const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
        
        if (minutes === 0 && seconds === 0) {
            this.showToast('لطفاً زمان معتبری تنظیم کنید', 'error');
            return;
        }

        this.timer.totalTime = minutes * 60 + seconds;
        this.timer.timeLeft = this.timer.totalTime;
        this.timer.isRunning = true;

        // Update UI
        document.getElementById('start-timer').disabled = true;
        document.getElementById('pause-timer').disabled = false;
        document.getElementById('timer-label').textContent = 'در حال انجام...';

        // Start countdown
        this.timer.interval = setInterval(() => {
            this.timer.timeLeft--;
            this.updateTimerDisplay();

            if (this.timer.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        if (!this.timer.isRunning) return;

        this.timer.isRunning = false;
        clearInterval(this.timer.interval);

        // Update UI
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
        document.getElementById('timer-label').textContent = 'متوقف شد';
    }

    resetTimer() {
        this.timer.isRunning = false;
        this.timer.timeLeft = 0;
        this.timer.totalTime = 0;
        
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
        }

        // Update UI
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
        document.getElementById('timer-label').textContent = 'آماده شروع';
        document.getElementById('timer-progress').style.width = '0%';

        this.updateTimerDisplay();
    }

    completeTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);

        // Update UI
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
        document.getElementById('timer-label').textContent = 'استراحت تمام شد!';
        document.getElementById('timer-progress').style.width = '100%';

        // Show notification
        this.showToast('زمان استراحت به پایان رسید!', 'success');

        // Play notification sound
        this.playNotificationSound();

        // Reset after 3 seconds
        setTimeout(() => {
            this.resetTimer();
        }, 3000);
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.3;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Fallback: just show toast if audio fails
        }
    }

    setTimer(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        document.getElementById('timer-minutes').value = minutes;
        document.getElementById('timer-seconds').value = secs;
        
        this.updateTimerDisplay();
    }

    // Workout Plan
    loadWorkoutPlan() {
        // Any additional logic for workout plan page
        this.showWorkoutPlanSession('A'); // Default to session A
    }

    // History and Filters
    renderExerciseList() {
        let filteredExercises = [...this.exercises];

        // Apply filters
        if (this.filters.startDate) {
            filteredExercises = filteredExercises.filter(ex => ex.date >= this.filters.startDate);
        }
        if (this.filters.endDate) {
            filteredExercises = filteredExercises.filter(ex => ex.date <= this.filters.endDate);
        }
        if (this.filters.exerciseName) {
            filteredExercises = filteredExercises.filter(ex => ex.name === this.filters.exerciseName);
        }

        const container = document.getElementById('exercise-list');

        if (filteredExercises.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>تمرینی یافت نشد</h3>
                    <p>سعی کنید فیلترها را تغییر دهید</p>
                </div>
            `;
            return;
        }

        const sortedExercises = filteredExercises.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        container.innerHTML = sortedExercises.map(exercise => this.createExerciseCard(exercise)).join('');
    }

    createExerciseCard(exercise) {
        const date = new Date(exercise.date);
        const time = new Date(`1970-01-01T${exercise.time}`);
        const dateString = date.toLocaleDateString('fa-IR');
        const timeString = time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const totalVolume = exercise.weight * exercise.sets * exercise.reps;

        return `
            <div class="exercise-card">
                <div class="exercise-header">
                    <div class="exercise-session-badge session-${exercise.session}">
                        جلسه ${exercise.session}
                    </div>
                    <h3 class="exercise-title">${exercise.name}</h3>
                    <div class="exercise-actions">
                        <button class="action-btn" onclick="tracker.editExercise(${exercise.id})" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="tracker.deleteExercise(${exercise.id})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="exercise-details">
                    <div class="exercise-detail">
                        <div class="detail-label">وزن</div>
                        <div class="detail-value">${exercise.weight} کیلوگرم</div>
                    </div>
                    <div class="exercise-detail">
                        <div class="detail-label">ست</div>
                        <div class="detail-value">${exercise.sets}</div>
                    </div>
                    <div class="exercise-detail">
                        <div class="detail-label">تکرار</div>
                        <div class="detail-value">${exercise.reps}</div>
                    </div>
                    <div class="exercise-detail">
                        <div class="detail-label">حجم کل</div>
                        <div class="detail-value">${totalVolume.toFixed(1)}</div>
                    </div>
                </div>
                
                <div class="exercise-date">
                    <i class="fas fa-clock"></i>
                    ${timeString} | ${dateString}
                    ${exercise.notes ? `<br><i class="fas fa-sticky-note"></i> ${exercise.notes}` : ''}
                </div>
            </div>
        `;
    }

    // Filters
    applyFilters() {
        this.filters.startDate = document.getElementById('filter-start-date').value;
        this.filters.endDate = document.getElementById('filter-end-date').value;
        this.filters.exerciseName = document.getElementById('filter-exercise').value;
        
        this.renderExerciseList();
        this.showToast('فیلترها اعمال شدند', 'success');
    }

    clearFilters() {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        document.getElementById('filter-exercise').value = '';
        
        this.filters = {
            startDate: '',
            endDate: '',
            exerciseName: ''
        };
        
        this.renderExerciseList();
        this.showToast('فیلترها پاک شدند', 'success');
    }

    populateExerciseFilters() {
        const uniqueExercises = [...new Set(this.exercises.map(ex => ex.name))].sort();
        const filterSelect = document.getElementById('filter-exercise');
        
        filterSelect.innerHTML = '<option value="">همه تمرینات</option>' +
            uniqueExercises.map(ex => `<option value="${ex}">${ex}</option>`).join('');
    }

    updateStatsFilters() {
        const uniqueExercises = [...new Set(this.exercises.map(ex => ex.name))].sort();
        const statsFilter = document.getElementById('stats-exercise-filter');
        
        statsFilter.innerHTML = '<option value="">همه تمرینات</option>' +
            uniqueExercises.map(ex => `<option value="${ex}">${ex}</option>`).join('');
    }

    // Charts and Statistics
    updateProgressChart() {
        const ctx = document.getElementById('progress-chart').getContext('2d');
        const selectedExercise = document.getElementById('stats-exercise-filter').value;
        
        let filteredExercises = this.exercises;
        if (selectedExercise) {
            filteredExercises = this.exercises.filter(ex => ex.name === selectedExercise);
        }

        // Group by date and get max weight for each date
        const dateGroups = {};
        filteredExercises.forEach(exercise => {
            const date = exercise.date;
            if (!dateGroups[date]) {
                dateGroups[date] = [];
            }
            dateGroups[date].push(exercise.weight);
        });

        const sortedDates = Object.keys(dateGroups).sort();
        const maxWeights = sortedDates.map(date => Math.max(...dateGroups[date]));
        
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates.map(date => this.formatDate(date)),
                datasets: [{
                    label: selectedExercise || 'حداکثر وزن',
                    data: maxWeights,
                    borderColor: '#007BFF',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#A1A1AA'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#A1A1AA'
                        },
                        grid: {
                            color: '#2C2C2C'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#A1A1AA'
                        },
                        grid: {
                            color: '#2C2C2C'
                        }
                    }
                }
            }
        });
    }

    updateComparisonChart() {
        const ctx = document.getElementById('comparison-chart').getContext('2d');
        const exerciseGroups = {};
        
        this.exercises.forEach(exercise => {
            const name = exercise.name;
            if (!exerciseGroups[name]) {
                exerciseGroups[name] = [];
            }
            exerciseGroups[name].push(exercise);
        });

        const exercises = Object.keys(exerciseGroups);
        const avgVolumes = exercises.map(name => {
            const volumes = exerciseGroups[name].map(ex => ex.weight * ex.sets * ex.reps);
            return volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        });

        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: exercises,
                datasets: [{
                    label: 'حجم متوسط',
                    data: avgVolumes,
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    borderColor: '#007BFF',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#A1A1AA'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#A1A1AA'
                        },
                        grid: {
                            color: '#2C2C2C'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#A1A1AA'
                        },
                        grid: {
                            color: '#2C2C2C'
                        }
                    }
                }
            }
        });
    }

    renderSummaryStats() {
        const container = document.getElementById('summary-stats');
        
        if (this.exercises.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>هنوز آماری برای نمایش وجود ندارد</p>
                </div>
            `;
            return;
        }

        const totalSessions = this.exercises.length;
        const totalVolume = this.exercises.reduce((sum, ex) => sum + (ex.weight * ex.sets * ex.reps), 0);
        const avgWeight = this.exercises.reduce((sum, ex) => sum + ex.weight, 0) / totalSessions;
        const maxWeight = Math.max(...this.exercises.map(ex => ex.weight));
        
        // Session counts
        const sessionCounts = this.exercises.reduce((acc, ex) => {
            acc[ex.session] = (acc[ex.session] || 0) + 1;
            return acc;
        }, {});
        
        // Days since first exercise
        const firstExercise = new Date(Math.min(...this.exercises.map(ex => new Date(ex.dateTime))));
        const today = new Date();
        const daysPassed = Math.ceil((today - firstExercise) / (1000 * 60 * 60 * 24));
        
        const stats = [
            { label: 'مجموع جلسات', value: totalSessions },
            { label: 'حجم کل', value: totalVolume.toFixed(1) },
            { label: 'میانگین وزن', value: `${avgWeight.toFixed(1)} کیلوگرم` },
            { label: 'بیشترین وزن', value: `${maxWeight} کیلوگرم` },
            { label: 'روزهای تمرین', value: daysPassed },
            { label: 'جلسه A', value: sessionCounts.A || 0 },
            { label: 'جلسه B', value: sessionCounts.B || 0 },
            { label: 'جلسه C', value: sessionCounts.C || 0 }
        ];

        container.innerHTML = stats.map(stat => `
            <div class="summary-stat">
                <span class="summary-stat-label">${stat.label}</span>
                <span class="summary-stat-value">${stat.value}</span>
            </div>
        `).join('');
    }

    // Utility Functions
    setCurrentDateTime() {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        const timeString = now.toTimeString().slice(0, 5);
        
        document.getElementById('exercise-date').value = dateString;
        document.getElementById('exercise-time').value = timeString;
    }

    clearForm() {
        document.getElementById('exercise-form').reset();
        this.setCurrentDateTime();
        // Reset exercise dropdown to default state
        const exerciseSelect = document.getElementById('exercise-name');
        exerciseSelect.firstElementChild.textContent = 'ابتدا جلسه را انتخاب کنید';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Modal Management
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Global Functions
function showPage(pageName) {
    tracker.showPage(pageName);
}

function clearForm() {
    tracker.clearForm();
}

function applyFilters() {
    tracker.applyFilters();
}

function clearFilters() {
    tracker.clearFilters();
}

function addExerciseToPlan(exerciseName, session) {
    tracker.addExerciseToPlan(exerciseName, session);
}

// Timer Functions
function startTimer() {
    tracker.startTimer();
}

function pauseTimer() {
    tracker.pauseTimer();
}

function resetTimer() {
    tracker.resetTimer();
}

function setTimer(seconds) {
    tracker.setTimer(seconds);
}

// Initialize App
let tracker;

document.addEventListener('DOMContentLoaded', () => {
    tracker = new ExerciseTracker();
});

// Export for global access
window.tracker = tracker;