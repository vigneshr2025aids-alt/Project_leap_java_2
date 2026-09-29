const API_BASE = '/api';

// UI Navigation
function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('section-hidden'));
    document.getElementById(sectionId).classList.remove('section-hidden');
    
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('nav-active'));
    if(element) element.classList.add('nav-active');

    if(sectionId === 'admin-section') loadAdminData();
    if(sectionId === 'evaluate-section') loadEvaluateData();
    if(sectionId === 'leaderboard-section') fetchLeaderboard();
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    const icon = document.getElementById('toastIcon');
    
    msg.textContent = message;
    if(isError) {
        icon.className = 'fa-solid fa-circle-exclamation text-red-400';
    } else {
        icon.className = 'fa-solid fa-circle-check text-green-400';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// 1. Submit Film
document.getElementById('submitFilmForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title: document.getElementById('filmTitle').value,
        genre: document.getElementById('filmGenre').value,
        videoLink: document.getElementById('filmLink').value,
        teamDetails: document.getElementById('filmTeam').value
    };

    try {
        const res = await fetch(`${API_BASE}/entries`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            showToast('Film submitted successfully!');
            e.target.reset();
        } else {
            showToast('Failed to submit film', true);
        }
    } catch (err) { console.error(err); showToast('Network Error', true); }
});

// 2. Add Judge
document.getElementById('addJudgeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('judgeName').value,
        contactDetails: document.getElementById('judgeContact').value
    };
    try {
        const res = await fetch(`${API_BASE}/judges`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            showToast('Judge added!');
            e.target.reset();
            loadAdminData();
        }
    } catch (err) { showToast('Error adding judge', true); }
});

// 3. Add Criterion
document.getElementById('addCriterionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('critName').value,
        description: document.getElementById('critDesc').value,
        maxScore: document.getElementById('critMax').value
    };
    try {
        const res = await fetch(`${API_BASE}/criteria`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            showToast('Criterion added!');
            e.target.reset();
            reloadCriteria();
        }
    } catch (err) { showToast('Error adding criterion', true); }
});

// 4. Load Admin Data (Populate Selects & Criteria Table)
async function loadAdminData() {
    try {
        const [entriesRes, judgesRes, criteriaRes] = await Promise.all([
            fetch(`${API_BASE}/entries`),
            fetch(`${API_BASE}/judges`),
            fetch(`${API_BASE}/criteria`)
        ]);
        const entries = await entriesRes.json();
        const judges = await judgesRes.json();
        allCriteria = await criteriaRes.json();

        const entrySelect = document.getElementById('assignEntrySelect');
        entrySelect.innerHTML = '<option value="">-- Select Film --</option>';
        entries.forEach(e => {
            entrySelect.innerHTML += `<option value="${e.id}">${e.title} (${e.genre})</option>`;
        });

        const judgeSelect = document.getElementById('assignJudgeSelect');
        judgeSelect.innerHTML = '<option value="">-- Select Judge --</option>';
        judges.forEach(j => {
            judgeSelect.innerHTML += `<option value="${j.id}">${j.name}</option>`;
        });

        renderAdminCriteria();
    } catch (err) { console.error(err); }
}

function renderAdminCriteria() {
    const tbody = document.getElementById('adminCriteriaTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!allCriteria || allCriteria.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-3 py-4 text-center text-gray-400 text-xs italic">No criteria defined yet.</td></tr>';
        return;
    }
    allCriteria.forEach(c => {
        const descText = c.description ? `<div class="text-xs text-gray-500 font-normal mt-0.5">${escapeHtml(c.description)}</div>` : '';
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2.5 text-gray-900 font-medium">
                    <div>${escapeHtml(c.name)}</div>
                    ${descText}
                </td>
                <td class="px-3 py-2.5 text-center font-semibold text-gray-700">${c.maxScore}</td>
                <td class="px-3 py-2.5 text-right space-x-1 whitespace-nowrap">
                    <button type="button" onclick="editCriterion(${c.id})" class="text-xs px-2 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors" title="Edit Criterion">
                        <i class="fa-solid fa-pen-to-square mr-1"></i>Edit
                    </button>
                    <button type="button" onclick="deleteCriterion(${c.id})" class="text-xs px-2 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors" title="Delete Criterion">
                        <i class="fa-solid fa-trash mr-1"></i>Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

// 5. Assign Judge
document.getElementById('assignJudgeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const entryId = document.getElementById('assignEntrySelect').value;
    const judgeId = document.getElementById('assignJudgeSelect').value;

    if(!entryId || !judgeId) return;

    try {
        const res = await fetch(`${API_BASE}/contest/assign-judge?entryId=${entryId}&judgeId=${judgeId}`, {
            method: 'POST'
        });
        if(res.ok) {
            showToast('Judge assigned to film!');
        } else {
            showToast('Failed to assign', true);
        }
    } catch (err) { showToast('Error', true); }
});

// 6. Evaluate Load
let allCriteria = [];
const scoredPairs = new Set();

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadEvaluateData() {
    try {
        const [judgesRes, criteriaRes, entriesRes] = await Promise.all([
            fetch(`${API_BASE}/judges`),
            fetch(`${API_BASE}/criteria`),
            fetch(`${API_BASE}/entries`)
        ]);
        const judges = await judgesRes.json();
        allCriteria = await criteriaRes.json();
        window.allEntries = await entriesRes.json(); // store globally for filtering

        const judgeSelect = document.getElementById('evalJudgeSelect');
        judgeSelect.innerHTML = '<option value="">-- I am Judge --</option>';
        judges.forEach(j => {
            judgeSelect.innerHTML += `<option value="${j.id}">${j.name}</option>`;
        });

        const entrySelect = document.getElementById('evalEntrySelect');
        entrySelect.innerHTML = '<option value="">-- Select Assigned Film --</option>';
        entrySelect.onchange = checkAndRenderCriteria;

        checkAndRenderCriteria();
    } catch (err) { console.error(err); }
}

function checkAndRenderCriteria() {
    const judgeSelect = document.getElementById('evalJudgeSelect');
    const entrySelect = document.getElementById('evalEntrySelect');
    const judgeId = judgeSelect ? judgeSelect.value : '';
    const entryId = entrySelect ? entrySelect.value : '';
    const container = document.getElementById('criteriaContainer');

    if (judgeId && entryId) {
        renderCriteria();
    } else {
        container.innerHTML = '<p class="text-gray-500 text-center italic">Please select a judge and a film to load criteria.</p>';
    }
}

function loadAssignedEntries() {
    const judgeId = document.getElementById('evalJudgeSelect').value;
    const entrySelect = document.getElementById('evalEntrySelect');
    entrySelect.innerHTML = '<option value="">-- Select Assigned Film --</option>';
    
    if(!judgeId) {
        checkAndRenderCriteria();
        return;
    }

    // In a real app, backend should filter this. For UI simplicity, we filter on frontend based on assignedJudges array
    const assigned = window.allEntries ? window.allEntries.filter(e => e.assignedJudges && e.assignedJudges.some(j => j.id == judgeId)) : [];
    
    assigned.forEach(e => {
        entrySelect.innerHTML += `<option value="${e.id}">${e.title}</option>`;
    });

    if(assigned.length === 0) {
        entrySelect.innerHTML = '<option value="" disabled>No films assigned to this judge.</option>';
    }
    checkAndRenderCriteria();
}

function renderCriteria() {
    const container = document.getElementById('criteriaContainer');
    const judgeSelect = document.getElementById('evalJudgeSelect');
    const entrySelect = document.getElementById('evalEntrySelect');
    const judgeId = judgeSelect ? judgeSelect.value : '';
    const entryId = entrySelect ? entrySelect.value : '';

    if (!judgeId || !entryId) {
        container.innerHTML = '<p class="text-gray-500 text-center italic">Please select a judge and a film to load criteria.</p>';
        return;
    }

    const judgeOption = judgeSelect.options[judgeSelect.selectedIndex];
    const judgeName = judgeOption ? judgeOption.text : '';

    const entry = window.allEntries ? window.allEntries.find(e => e.id == entryId) : null;
    const filmTitle = entry ? entry.title : (entrySelect.options[entrySelect.selectedIndex] ? entrySelect.options[entrySelect.selectedIndex].text : '');

    let html = `
        <div class="mb-5 pb-3 border-b border-gray-200">
            <h3 class="text-2xl font-bold text-gray-900">
                Scoring: <span class="text-brand">${escapeHtml(filmTitle)}</span> by <span class="text-gray-700">${escapeHtml(judgeName)}</span>
            </h3>
        </div>
    `;

    if (!allCriteria || allCriteria.length === 0) {
        html += '<p class="text-gray-500 italic">No criteria defined yet. Ask admin to add some.</p>';
        container.innerHTML = html;
        return;
    }

    allCriteria.forEach(c => {
        const descText = c.description ? c.description : '';
        html += `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3 shadow-sm">
                <div class="w-2/3">
                    <label class="font-semibold text-gray-800 text-base">${escapeHtml(c.name)}</label>
                    <p class="text-sm text-gray-500 mt-0.5">${escapeHtml(descText)} (Max: ${c.maxScore})</p>
                </div>
                <div class="w-1/3 pl-4">
                    <input type="number" min="0" max="${c.maxScore}" data-crit-id="${c.id}" class="crit-score mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand focus:ring-brand p-2.5 border text-center font-bold text-brand text-lg bg-white" placeholder="0 - ${c.maxScore}">
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function deleteCriterion(id) {
    if (!confirm('Are you sure you want to delete this criterion?')) {
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/criteria/${id}`, {
            method: 'DELETE'
        });
        if (res.status === 204 || res.ok) {
            showToast('Criterion deleted successfully!');
            await reloadCriteria();
        } else if (res.status === 409) {
            const msg = await res.text();
            showToast(msg || 'Cannot delete: referenced by scorecards', true);
        } else if (res.status === 404) {
            showToast('Criterion not found', true);
        } else {
            showToast('Failed to delete criterion', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Error deleting criterion', true);
    }
}

async function editCriterion(id) {
    const crit = allCriteria.find(c => c.id === id);
    if (!crit) return;

    const newName = prompt('Enter updated criterion name:', crit.name);
    if (newName === null) return;
    if (!newName.trim()) {
        showToast('Criterion name cannot be empty', true);
        return;
    }

    const newDesc = prompt('Enter updated description:', crit.description || '');
    if (newDesc === null) return;

    const newMax = prompt('Enter updated max score:', crit.maxScore);
    if (newMax === null) return;
    const parsedMax = parseInt(newMax);
    if (isNaN(parsedMax) || parsedMax <= 0) {
        showToast('Max score must be a positive integer', true);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/criteria/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newName.trim(),
                description: newDesc.trim(),
                maxScore: parsedMax
            })
        });
        if (res.ok) {
            showToast('Criterion updated successfully!');
            await reloadCriteria();
        } else {
            showToast('Failed to update criterion', true);
        }
    } catch (err) {
        console.error(err);
        showToast('Error updating criterion', true);
    }
}

async function reloadCriteria() {
    try {
        const res = await fetch(`${API_BASE}/criteria`);
        allCriteria = await res.json();
        renderAdminCriteria();
        checkAndRenderCriteria();
    } catch (err) {
        console.error('Error reloading criteria:', err);
    }
}

// 7. Submit Evaluation
async function submitEvaluation() {
    const judgeSelect = document.getElementById('evalJudgeSelect');
    const entrySelect = document.getElementById('evalEntrySelect');
    const judgeId = judgeSelect.value;
    const entryId = entrySelect.value;

    if(!judgeId || !entryId) {
        showToast('Please select judge and film.', true);
        return;
    }

    if (scoredPairs.has(`${judgeId}-${entryId}`)) {
        showToast('This film has already been scored by this judge.', true);
        return;
    }

    const scores = {};
    let allFilled = true;
    document.querySelectorAll('.crit-score').forEach(input => {
        const score = input.value;
        if(score === '') allFilled = false;
        scores[input.getAttribute('data-crit-id')] = parseInt(score);
    });

    if(!allFilled) {
        showToast('Please fill all criteria scores.', true);
        return;
    }

    const payload = {
        entry: { id: parseInt(entryId) },
        judge: { id: parseInt(judgeId) },
        criteriaScores: scores
    };

    try {
        const res = await fetch(`${API_BASE}/contest/submit-score`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        if(res.ok) {
            showToast('Scorecard submitted successfully!');
            scoredPairs.add(`${judgeId}-${entryId}`);
            document.querySelectorAll('.crit-score').forEach(inp => inp.value = '');
            renderCriteria();
        } else {
            const errText = await res.text();
            if (errText && errText.toLowerCase().includes('already submitted')) {
                scoredPairs.add(`${judgeId}-${entryId}`);
                showToast('This film has already been scored by this judge.', true);
                renderCriteria();
            } else {
                showToast(errText || 'Failed to submit', true);
            }
        }
    } catch (err) { showToast('Error submitting scorecard', true); }
}

// 8. Leaderboard
async function fetchLeaderboard() {
    try {
        const res = await fetch(`${API_BASE}/entries/leaderboard`);
        const entries = await res.json();
        
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = '';
        
        entries.forEach((entry, index) => {
            const isWinner = index === 0 && entry.finalScore > 0;
            const rankHtml = isWinner ? '<i class="fa-solid fa-crown text-yellow-500 text-xl"></i>' : `<span class="font-bold text-gray-500">${index + 1}</span>`;
            
            const badgeClass = entry.submissionStatus === 'EVALUATED' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800';

            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 transition-colors ${isWinner ? 'bg-yellow-50/30' : ''}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                            ${rankHtml}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${entry.title}</div>
                        <div class="text-xs text-gray-500"><a href="${entry.videoLink}" target="_blank" class="text-brand hover:underline">Watch <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a></div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                            ${entry.genre}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}">
                            ${entry.submissionStatus || 'SUBMITTED'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-lg font-bold text-gray-900">
                        ${entry.finalScore ? entry.finalScore.toFixed(1) : '-'}
                    </td>
                </tr>
            `;
        });
    } catch (err) { console.error('Error fetching leaderboard', err); }
}

// Init
window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') || (window.location.hash ? window.location.hash.replace('#', '') : null);
    if (section) {
        showSection(section, document.querySelector(`a[onclick*="${section}"]`));
        if (section === 'evaluate-section') {
            await loadEvaluateData();
            const judgeNameParam = params.get('judge');
            const filmTitleParam = params.get('film');
            if (judgeNameParam) {
                const judgeSelect = document.getElementById('evalJudgeSelect');
                for (let opt of judgeSelect.options) {
                    if (opt.text.toLowerCase().includes(judgeNameParam.toLowerCase())) {
                        judgeSelect.value = opt.value;
                        loadAssignedEntries();
                        break;
                    }
                }
            }
            if (filmTitleParam) {
                const entrySelect = document.getElementById('evalEntrySelect');
                for (let opt of entrySelect.options) {
                    if (opt.text.toLowerCase().includes(filmTitleParam.toLowerCase())) {
                        entrySelect.value = opt.value;
                        checkAndRenderCriteria();
                        break;
                    }
                }
            }
        }
    }
};
