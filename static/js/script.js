(function() {
	// Класс для управления данными игроков
	class PlayerDataManager {
		constructor() {
			this.players = [];
			this.filteredPlayers = [];
			this.tiPlayers = [];
			this.filteredTIPlayers = [];
			this.init();
		}

		async init() {
			await this.loadAllPlayers();
			await this.loadTIPlayers();
			this.renderTable();
			this.renderTITable();
			this.initTableManager();
			this.initTITableManager();
			this.initThemeToggle();
			this.initHelpButton();
			this.initDonateButton();
			this.hideLoadingMessage();
		}

		async loadAllPlayers() {
			try {
				// Получаем список всех JSON файлов из папки players
				const playerFiles = await this.getPlayerFiles();
				console.log(`Найдено ${playerFiles.length} файлов игроков:`, playerFiles);
				
				const loadPromises = playerFiles.map(filename => this.loadPlayerData(filename));
				const results = await Promise.allSettled(loadPromises);
				
				this.players = results
					.filter(result => result.status === 'fulfilled' && result.value)
					.map(result => result.value);
				
				console.log(`Успешно загружено ${this.players.length} игроков`);
				
				// Сортируем по fantasy points
				this.players.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
				this.filteredPlayers = [...this.players];
			} catch (error) {
				console.error('Ошибка при загрузке игроков:', error);
				// Fallback на старый список файлов если что-то пошло не так
				await this.loadPlayersFallback();
			}
		}

		async getPlayerFiles() {
			// Сначала пытаемся прочитать конфигурационный файл
			try {
				const response = await fetch('players_config.json');
				if (response.ok) {
					const config = await response.json();
					console.log('✓ Загружен конфигурационный файл');
					return config.players || [];
				}
			} catch (error) {
				console.log('Конфигурационный файл не найден, используем автоматическое сканирование');
			}
			
			// Если конфиг не найден, используем автоматическое сканирование
			return await this.scanPlayerDirectory();
		}

		async scanPlayerDirectory() {
			const availablePlayers = [];
			
			// Список возможных имен игроков (можно расширять)
			const possibleNames = [
				// Текущие игроки
				'9Class.json', 'AMMAR_THE_F.json', 'Bach.json', 'Collapse.json', 'Cr1t-.json',
				'DM.json', 'Dukalis.json', 'Larl.json', 'Malr1ne.json', 'Miposhka.json',
				'No[o]ne-.json', 'NothingToSay.json', 'planet.json', 'rue.json', 'Satanic.json',
				'shiro.json', 'skiter.json', 'Sneyking.json', 'y`.json', 'Yatoro.json',
				
				// Дополнительные возможные имена (можно добавлять)
				'player1.json', 'player2.json', 'new_player.json', 'test_player.json',
				'player_2025.json', 'ti_player.json', 'fantasy_player.json'
			];
			
			console.log('Сканирую папку players/...');
			
			// Проверяем каждый файл на существование
			for (const filename of possibleNames) {
				try {
					const response = await fetch(`players/${filename}`);
					if (response.ok) {
						availablePlayers.push(filename);
						console.log(`✓ Найден: ${filename}`);
					}
				} catch (error) {
					// Файл не найден, пропускаем
				}
			}
			
			console.log(`Всего найдено: ${availablePlayers.length} игроков`);
			return availablePlayers;
		}

		async loadPlayersFallback() {
			console.log('Используем fallback список игроков');
			const fallbackFiles = [
				'9Class.json', 'AMMAR_THE_F.json', 'Bach.json', 'Collapse.json', 'Cr1t-.json',
				'DM.json', 'Dukalis.json', 'Larl.json', 'Malr1ne.json', 'Miposhka.json',
				'No[o]ne-.json', 'NothingToSay.json', 'planet.json', 'rue.json', 'Satanic.json',
				'shiro.json', 'skiter.json', 'Sneyking.json', 'y`.json', 'Yatoro.json'
			];
			
			const loadPromises = fallbackFiles.map(filename => this.loadPlayerData(filename));
			const results = await Promise.allSettled(loadPromises);
			
			this.players = results
				.filter(result => result.status === 'fulfilled' && result.value)
				.map(result => result.value);
			
			this.players.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
			this.filteredPlayers = [...this.players];
		}

		async loadTIPlayers() {
			try {
				// Получаем список TI игроков из players/18324/
				const tiPlayerFiles = await this.getTIPlayerFiles();
				console.log(`Найдено ${tiPlayerFiles.length} TI игроков:`, tiPlayerFiles);
				
				const loadPromises = tiPlayerFiles.map(filename => this.loadTIPlayerData(filename));
				const results = await Promise.allSettled(loadPromises);
				
				this.tiPlayers = results
					.filter(result => result.status === 'fulfilled' && result.value)
					.map(result => result.value);
				
				console.log(`Успешно загружено ${this.tiPlayers.length} TI игроков`);
				
				// Сортируем по fantasy points
				this.tiPlayers.sort((a, b) => b.fantasyPoints - a.fantasyPoints);
				this.filteredTIPlayers = [...this.tiPlayers];
			} catch (error) {
				console.error('Ошибка при загрузке TI игроков:', error);
			}
		}

		async getTIPlayerFiles() {
			try {
				const response = await fetch('players/18324/players_config.json');
				if (response.ok) {
					const config = await response.json();
					console.log('✓ Загружен конфигурационный файл TI игроков');
					return config.players || [];
				}
			} catch (error) {
				console.log('Конфигурационный файл TI игроков не найден');
			}
			return [];
		}

		async loadTIPlayerData(filename) {
			try {
				const response = await fetch(`players/18324/${filename}`);
				if (!response.ok) {
					console.warn(`Failed to load TI player ${filename}: ${response.status}`);
					return null;
				}
				const data = await response.json();
				return this.processTIPlayerData(data);
			} catch (error) {
				console.warn(`Error loading TI player ${filename}:`, error);
				return null;
			}
		}

		processTIPlayerData(playerData) {
			const stats = playerData.stats;
			
			// Вычисляем fantasy points согласно правилам
			const fantasyPoints = this.calculateFantasyPoints(stats);
			
			return {
				nickname: playerData.nickname,
				team: playerData.team,
				position: playerData.position || 1, // TI данные могут не иметь позиции
				matches: playerData.matches_analyzed,
				kills: stats.kills,
				deaths: stats.deaths,
				lastHits: stats.last_hits,
				denies: stats.denies,
				gpm: stats.gold_per_min,
				towerKills: stats.tower_kills,
				observerUses: stats.observer_uses,
				campsStacked: stats.camps_stacked,
				runePickups: stats.rune_pickups,
				roshanKills: stats.roshan_kills,
				teamfightParticipation: stats.teamfight_participation,
				stuns: stats.stuns,
				courierKills: stats.courier_kills,
				smokeUses: stats.smoke_uses,
				firstBloods: stats.first_bloods,
				fantasyPoints: fantasyPoints
			};
		}

		async loadPlayerData(filename) {
			try {
				const response = await fetch(`players/${filename}`);
				if (!response.ok) {
					console.warn(`Failed to load ${filename}: ${response.status}`);
					return null;
				}
				const data = await response.json();
				return this.processPlayerData(data);
			} catch (error) {
				console.warn(`Error loading ${filename}:`, error);
				return null;
			}
		}

		processPlayerData(playerData) {
			const stats = playerData.stats;
			
			// Вычисляем fantasy points согласно правилам
			const fantasyPoints = this.calculateFantasyPoints(stats);
			
			return {
				nickname: playerData.nickname,
				team: playerData.team,
				position: playerData.position,
				matches: playerData.matches_analyzed,
				kills: stats.kills,
				deaths: stats.deaths,
				lastHits: stats.last_hits,
				denies: stats.denies,
				gpm: stats.gold_per_min,
				towerKills: stats.tower_kills,
				observerUses: stats.observer_uses,
				campsStacked: stats.camps_stacked,
				runePickups: stats.rune_pickups,
				roshanKills: stats.roshan_kills,
				teamfightParticipation: stats.teamfight_participation,
				stuns: stats.stuns,
				courierKills: stats.courier_kills,
				smokeUses: stats.smoke_uses,
				firstBloods: stats.first_bloods,
				fantasyPoints: fantasyPoints
			};
		}

		calculateFantasyPoints(stats) {
			let points = 0;
			
			// KILLS: +121 per kill
			points += stats.kills * 121;
			
			// DEATHS: 1800 starting points, -180.00 per death
			points += 1800 - (stats.deaths * 180);
			
			// CREEP SCORE: +3 per last hit or deny
			points += (stats.last_hits + stats.denies) * 3;
			
			// GPM: Scores player's GPM multiplied by 2
			points += stats.gold_per_min * 2;
			
			// TOWER KILLS: +340 per Tower last hit
			points += stats.tower_kills * 340;
			
			// WARDS PLACED: +113 per observer ward placed
			points += stats.observer_uses * 113;
			
			// CAMPS STACKED: +170 per camp stacked
			points += stats.camps_stacked * 170;
			
			// RUNES GRABBED: +121 per rune bottled or taken
			points += stats.rune_pickups * 121;
			
			// ROSHAN KILLS: +850 per Roshan kill
			points += stats.roshan_kills * 850;
			
			// TEAMFIGHTS: Max 1895 points for participating in team fights
			// Если teamfight_participation >= 1.0, то 1895 points, иначе пропорционально
			if (stats.teamfight_participation >= 1.0) {
				points += 1895;
			} else {
				points += stats.teamfight_participation * 1895;
			}
			
			// STUNS: +15 per second of stun
			points += stats.stuns * 15;
			
			// COURIER KILLS: +850 per courier kill
			points += stats.courier_kills * 850;
			
			// FIRST BLOOD: 1700 points if the player gets first blood
			// Даем очки пропорционально средней статистике
			points += stats.first_bloods * 1700;
			
			// SMOKES USED: +283 per Smoke of Deceit used
			points += stats.smoke_uses * 283;
			
			return Math.round(points);
		}

		renderTable() {
			const tbody = document.getElementById('statsTableBody');
			if (!tbody) return;

			tbody.innerHTML = '';
			
			// Вычисляем лучшие и худшие значения для каждого столбца
			const columnStats = this.calculateColumnStats();
			
			this.filteredPlayers.forEach(player => {
				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${player.position}</td>
					<td>${player.nickname}</td>
					<td>${player.team}</td>
					<td class="${this.getCellClass(player.fantasyPoints, columnStats.fantasyPoints)}">${player.fantasyPoints.toLocaleString()}</td>
					<td class="${this.getCellClass(player.kills, columnStats.kills)}">${player.kills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.deaths, columnStats.deaths, true)}">${player.deaths.toFixed(2)}</td>
					<td class="${this.getCellClass(player.lastHits, columnStats.lastHits)}">${player.lastHits.toFixed(1)}</td>
					<td class="${this.getCellClass(player.denies, columnStats.denies)}">${player.denies.toFixed(1)}</td>
					<td class="${this.getCellClass(player.gpm, columnStats.gpm)}">${player.gpm.toFixed(2)}</td>
					<td class="${this.getCellClass(player.towerKills, columnStats.towerKills)}">${player.towerKills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.observerUses, columnStats.observerUses)}">${player.observerUses.toFixed(2)}</td>
					<td class="${this.getCellClass(player.campsStacked, columnStats.campsStacked)}">${player.campsStacked.toFixed(2)}</td>
					<td class="${this.getCellClass(player.runePickups, columnStats.runePickups)}">${player.runePickups.toFixed(2)}</td>
					<td class="${this.getCellClass(player.roshanKills, columnStats.roshanKills)}">${player.roshanKills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.teamfightParticipation, columnStats.teamfightParticipation)}">${(player.teamfightParticipation * 100).toFixed(1)}%</td>
					<td class="${this.getCellClass(player.stuns, columnStats.stuns)}">${player.stuns.toFixed(2)}</td>
					<td class="${this.getCellClass(player.courierKills, columnStats.courierKills)}">${player.courierKills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.smokeUses, columnStats.smokeUses)}">${player.smokeUses.toFixed(2)}</td>
					<td class="${this.getCellClass(player.firstBloods, columnStats.firstBloods)}">${player.firstBloods.toFixed(2)}</td>
				`;
				tbody.appendChild(row);
			});
		}

		renderTITable() {
			const tbody = document.getElementById('statsTableBodyTI');
			if (!tbody) return;

			tbody.innerHTML = '';
			
			// Вычисляем лучшие и худшие значения для каждого столбца TI
			const columnStats = this.calculateTIColumnStats();
			
			this.filteredTIPlayers.forEach(player => {
				const row = document.createElement('tr');
				row.innerHTML = `
					<td>${player.position}</td>
					<td>${player.nickname}</td>
					<td>${player.team}</td>
					<td class="${this.getCellClass(player.fantasyPoints, columnStats.fantasyPoints)}">${player.fantasyPoints.toLocaleString()}</td>
					<td class="${this.getCellClass(player.kills, columnStats.kills)}">${player.kills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.deaths, columnStats.deaths, true)}">${player.deaths.toFixed(2)}</td>
					<td class="${this.getCellClass(player.lastHits, columnStats.lastHits)}">${player.lastHits.toFixed(1)}</td>
					<td class="${this.getCellClass(player.denies, columnStats.denies)}">${player.denies.toFixed(1)}</td>
					<td class="${this.getCellClass(player.gpm, columnStats.gpm)}">${player.gpm.toFixed(2)}</td>
					<td class="${this.getCellClass(player.towerKills, columnStats.towerKills)}">${player.towerKills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.observerUses, columnStats.observerUses)}">${player.observerUses.toFixed(2)}</td>
					<td class="${this.getCellClass(player.campsStacked, columnStats.campsStacked)}">${player.campsStacked.toFixed(2)}</td>
					<td class="${this.getCellClass(player.runePickups, columnStats.runePickups)}">${player.runePickups.toFixed(2)}</td>
					<td class="${this.getCellClass(player.roshanKills, columnStats.roshanKills)}">${player.roshanKills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.teamfightParticipation, columnStats.teamfightParticipation)}">${(player.teamfightParticipation * 100).toFixed(1)}%</td>
					<td class="${this.getCellClass(player.stuns, columnStats.stuns)}">${player.stuns.toFixed(2)}</td>
					<td class="${this.getCellClass(player.courierKills, columnStats.courierKills)}">${player.courierKills.toFixed(2)}</td>
					<td class="${this.getCellClass(player.smokeUses, columnStats.smokeUses)}">${player.smokeUses.toFixed(2)}</td>
					<td class="${this.getCellClass(player.firstBloods, columnStats.firstBloods)}">${player.firstBloods.toFixed(2)}</td>
				`;
				tbody.appendChild(row);
			});
		}

		calculateColumnStats() {
			if (this.filteredPlayers.length === 0) return {};

			const stats = {};
			
			// Получаем все числовые значения для каждого столбца
			const columns = {
				fantasyPoints: this.filteredPlayers.map(p => p.fantasyPoints),
				kills: this.filteredPlayers.map(p => p.kills),
				deaths: this.filteredPlayers.map(p => p.deaths),
				lastHits: this.filteredPlayers.map(p => p.lastHits),
				denies: this.filteredPlayers.map(p => p.denies),
				gpm: this.filteredPlayers.map(p => p.gpm),
				towerKills: this.filteredPlayers.map(p => p.towerKills),
				observerUses: this.filteredPlayers.map(p => p.observerUses),
				campsStacked: this.filteredPlayers.map(p => p.campsStacked),
				runePickups: this.filteredPlayers.map(p => p.runePickups),
				roshanKills: this.filteredPlayers.map(p => p.roshanKills),
				teamfightParticipation: this.filteredPlayers.map(p => p.teamfightParticipation),
				stuns: this.filteredPlayers.map(p => p.stuns),
				courierKills: this.filteredPlayers.map(p => p.courierKills),
				smokeUses: this.filteredPlayers.map(p => p.smokeUses),
				firstBloods: this.filteredPlayers.map(p => p.firstBloods)
			};

			// Вычисляем min/max для каждого столбца
			Object.keys(columns).forEach(key => {
				const values = columns[key];
				stats[key] = {
					min: Math.min(...values),
					max: Math.max(...values)
				};
			});

			return stats;
		}

		calculateTIColumnStats() {
			if (this.filteredTIPlayers.length === 0) return {};

			const stats = {};
			
			// Получаем все числовые значения для каждого столбца TI
			const columns = {
				fantasyPoints: this.filteredTIPlayers.map(p => p.fantasyPoints),
				kills: this.filteredTIPlayers.map(p => p.kills),
				deaths: this.filteredTIPlayers.map(p => p.deaths),
				lastHits: this.filteredTIPlayers.map(p => p.lastHits),
				denies: this.filteredTIPlayers.map(p => p.denies),
				gpm: this.filteredTIPlayers.map(p => p.gpm),
				towerKills: this.filteredTIPlayers.map(p => p.towerKills),
				observerUses: this.filteredTIPlayers.map(p => p.observerUses),
				campsStacked: this.filteredTIPlayers.map(p => p.campsStacked),
				runePickups: this.filteredTIPlayers.map(p => p.runePickups),
				roshanKills: this.filteredTIPlayers.map(p => p.roshanKills),
				teamfightParticipation: this.filteredTIPlayers.map(p => p.teamfightParticipation),
				stuns: this.filteredTIPlayers.map(p => p.stuns),
				courierKills: this.filteredTIPlayers.map(p => p.courierKills),
				smokeUses: this.filteredTIPlayers.map(p => p.smokeUses),
				firstBloods: this.filteredTIPlayers.map(p => p.firstBloods)
			};

			// Вычисляем min/max для каждого столбца
			Object.keys(columns).forEach(key => {
				const values = columns[key];
				stats[key] = {
					min: Math.min(...values),
					max: Math.max(...values)
				};
			});

			return stats;
		}

		getCellClass(value, columnStat, lowerIsBetter = false) {
			if (!columnStat) return '';
			
			if (lowerIsBetter) {
				// Для столбцов где меньше = лучше (например, deaths)
				if (value === columnStat.min) return 'best';
				if (value === columnStat.max) return 'worst';
			} else {
				// Для столбцов где больше = лучше
				if (value === columnStat.max) return 'best';
				if (value === columnStat.min) return 'worst';
			}
			
			return '';
		}

		initTableManager() {
			new TableManager('statsTable', 'tableContainer', 'toggleTableBtn', 'pos-filter-btn');
		}

		initTITableManager() {
			new TableManager('statsTableTI', 'tableContainerTI', 'toggleTableBtnTI', 'pos-filter-btn');
		}

		initThemeToggle() {
			const themeToggle = document.getElementById('themeToggle');
			if (themeToggle) {
				themeToggle.addEventListener('click', () => {
					document.body.classList.toggle('dark');
					const isDark = document.body.classList.contains('dark');
					themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
				});
			}
		}

		initHelpButton() {
			const helpButton = document.getElementById('helpButton');
			const helpDropdown = document.getElementById('helpDropdown');
			
			if (helpButton && helpDropdown) {
				helpButton.addEventListener('click', () => {
					helpDropdown.classList.toggle('show');
				});

				// Закрытие при клике вне dropdown
				document.addEventListener('click', (event) => {
					if (!helpButton.contains(event.target) && !helpDropdown.contains(event.target)) {
						helpDropdown.classList.remove('show');
					}
				});
			}
		}

		initDonateButton() {
			const donateButton = document.getElementById('donateButton');
			const playButton = document.getElementById('playButton');
			
			// Создаем аудио элемент
			const audio = new Audio('kitty.wav');
			
			if (donateButton) {
				donateButton.addEventListener('click', () => {
					window.open('https://www.donationalerts.com/r/krutiedonati', '_blank');
				});
			}
			
			if (playButton) {
				playButton.addEventListener('click', (event) => {
					event.stopPropagation();
					
					// Воспроизводим аудио
					try {
						audio.currentTime = 0; // Сбрасываем время воспроизведения
						audio.play().then(() => {
							console.log('Аудио воспроизводится');
						}).catch(error => {
							console.error('Ошибка воспроизведения аудио:', error);
							alert('Ошибка воспроизведения аудио: ' + error.message);
						});
					} catch (error) {
						console.error('Ошибка при попытке воспроизведения:', error);
					}
				});
			}
		}

		hideLoadingMessage() {
			const loadingMessage = document.getElementById('loadingMessage');
			if (loadingMessage) {
				loadingMessage.style.display = 'none';
			}
		}
	}

	// Universal table management system
	class TableManager {
		constructor(tableId, containerId, toggleBtnId, filterBtnClass) {
			this.tableId = tableId;
			this.containerId = containerId;
			this.toggleBtnId = toggleBtnId;
			this.filterBtnClass = filterBtnClass;
			this.container = document.getElementById(containerId);
			this.toggleBtn = document.getElementById(toggleBtnId);
			this.filterBtns = document.querySelectorAll(`#${containerId} .${filterBtnClass}`);
			this.tableRows = document.querySelectorAll(`#${tableId} tbody tr`);
			this.table = document.getElementById(tableId);
			
			this.init();
		}
		
		init() {
			if (this.container && this.toggleBtn) {
				this.initToggle();
			}
			if (this.filterBtns.length > 0 && this.tableRows.length > 0) {
				this.initFilters();
			}
			if (this.table) {
				this.initSorting();
			}
		}
		
		initToggle() {
			this.container.classList.add('expanded');
			this.toggleBtn.textContent = '▼';
			
			this.toggleBtn.addEventListener('click', () => {
				const isCollapsed = this.container.classList.contains('collapsed');
				
				if (isCollapsed) {
					this.container.classList.remove('collapsed');
					this.container.classList.add('expanded');
					this.toggleBtn.textContent = '▼';
				} else {
					this.container.classList.remove('expanded');
					this.container.classList.add('collapsed');
					this.toggleBtn.textContent = '▶';
				}
			});
		}
		
		initFilters() {
			this.filterBtns.forEach(btn => {
				btn.addEventListener('click', () => {
					btn.classList.toggle('active');
					this.applyFilters();
				});
			});
			
			this.applyFilters();
		}
		
		initSorting() {
			const thead = this.table.tHead;
			if (!thead) return;
			
			let sortState = { col: -1, dir: 1 };
			
			const getCellValue = (row, index) => {
				const cell = row.children[index];
				if (!cell) return '';
				
				const text = cell.innerText.trim();
				
				// Специальная обработка для Fantasy Points (убираем запятые)
				if (index === 3) { // Fantasy Points колонка теперь четвёртая
					return parseInt(text.replace(/,/g, '')) || 0;
				}
				
				// Для процентных значений
				if (text.includes('%')) {
					return parseFloat(text.replace('%', '')) || 0;
				}
				
				// Для обычных числовых значений
				const asNum = parseFloat(text.replace(',', '.'));
				return isNaN(asNum) ? text.toLowerCase() : asNum;
			};
			
			const clearSortIndicators = () => {
				[...thead.rows[0].cells].forEach(th => {
					th.classList.remove('sort-asc', 'sort-desc');
				});
			};
			
			const updateIndicator = (th, dir) => {
				th.classList.add(dir === 1 ? 'sort-asc' : 'sort-desc');
			};
			
			const sortByColumn = (colIndex) => {
				const tbody = this.table.tBodies[0];
				const rows = Array.from(tbody.querySelectorAll('tr'));
				let dir = 1;
				if (sortState.col === colIndex) dir = -sortState.dir;

				rows.sort((a, b) => {
					const A = getCellValue(a, colIndex);
					const B = getCellValue(b, colIndex);
					
					// Если оба значения числовые
					if (typeof A === 'number' && typeof B === 'number') {
						return (A - B) * dir;
					}
					
					// Если оба значения строковые
					if (typeof A === 'string' && typeof B === 'string') {
						if (A < B) return -1 * dir;
						if (A > B) return 1 * dir;
						return 0;
					}
					
					// Если разные типы, приводим к строкам
					const strA = String(A).toLowerCase();
					const strB = String(B).toLowerCase();
					if (strA < strB) return -1 * dir;
					if (strA > strB) return 1 * dir;
					return 0;
				});
				
				clearSortIndicators();
				updateIndicator(thead.rows[0].cells[colIndex], dir);
				
				rows.forEach(row => tbody.appendChild(row));
				sortState = { col: colIndex, dir };
			};
			
			[...thead.rows[0].cells].forEach((th, index) => {
				th.addEventListener('click', () => sortByColumn(index));
			});
		}
		
		applyFilters() {
			const activePositions = Array.from(this.filterBtns)
				.filter(btn => btn.classList.contains('active'))
				.map(btn => parseInt(btn.dataset.pos));
			
			this.tableRows.forEach(row => {
				const positionCell = row.children[0]; // Position column теперь первая
				const position = parseInt(positionCell.textContent);
				
				if (activePositions.includes(position)) {
					row.style.display = '';
				} else {
					row.style.display = 'none';
				}
			});
		}
	}

	// Инициализация при загрузке страницы
	document.addEventListener('DOMContentLoaded', () => {
		new PlayerDataManager();
	});
})();
