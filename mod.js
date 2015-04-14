(function($) {
	var weekGridDayRowSelector = 'table:eq(1) > tbody > tr';

	
	/**
	 * The weekday clicking feature is intended to emulate the OneTime calendar clicking functionality in that:
	 *   - Clicking on a day will never result in the month changing (unless enabled via options)
	 *   - Non-clickable days (those outside the displayed month) are displayed in grey.
	 *   - Clicking a weekday should trigger an update to various OneTime panes as if it were a calendar click
	 */
	function enableWeekGridClicking($calendar, calendar, $weekGrid, weekGrid, allowMonthChange) {
		$calendar.bind('navigate', updateWeekGridClickability);
		$weekGrid.bind('dataBound', updateWeekGridClickability);
		updateWeekGridClickability();


		$weekGrid.delegate(weekGridDayRowSelector, 'click', function() {
			var $tr = $(this),
				date = $tr.data('date');

			if ($tr.hasClass('clickable')) 
				ots.core.oneTime.selectDayInCalendar($calendar, calendar, date, allowMonthChange);
		});

		
		function updateWeekGridClickability() {
			var calendarMonth = calendar.viewedMonth.month();

			$weekGrid.find(weekGridDayRowSelector).each(function() {
				var $tr = $(this),
					dayDatum = weekGrid.data[$tr.index()];

				// This occurs if we rapidly transition between months under certain circumstances (e.g. repeatedly
				// hammer Find Incomplete). Presumably, this absence of data is a result of the week grid not yet 
				// being ready. At this stage, we'll simply skip this day - a subsequent invocation will sort it out.
				// TODO: Better fix for this.
				if (!dayDatum)
					return true;				

				var boundDateTime = dayDatum.weekDateTime;

				$tr.data('date', boundDateTime);
				
				var makeClickable = allowMonthChange || boundDateTime.getMonth() === calendarMonth;
				$tr.toggleClass('clickable', makeClickable);
				$tr.toggleClass('non-clickable', !makeClickable);
			});
		}
	}

	
	function enableTodayHighlighting($calendar, calendar, $weekGrid) {
		$calendar.bind('navigate change', highlightToday);
		$weekGrid.bind('dataBound', highlightToday);

		highlightToday();


		function highlightToday() {
			if (!ots.core.oneTime.calendarIsInStandardMode(calendar))
				return;

			var today = ots.core.oneTime.getDayInDisplayedCalendar($calendar, calendar, ots.core.dates.getDateNow());

			$calendar.find('.t-content tbody tr td.today').not(today ? today.$td : []).removeClass('today');

			if (today)
				today.$td.addClass('today');								
		}
	}


	function enableFavouritesFiltering($favTab) {
		var $li = $('<li class="favourites-filter"></li>')
			.appendTo($favTab.find('ul.t-tabstrip-items'));

		// Create search box and attach change handler
		var $searchBox = $('<input type="search" placeholder="Type here to filter" />')
			.appendTo($li)
			// Using 'keyup' as 'keypress' ignores backspace. 'search' is fired when the user presses <RET> or clicks the X.
			// Deliberately avoiding events like blur and change which will fire when tab is changed (as this causes flicker)
			.bind('keyup mouseout mousedown search', runFilter);

		// When a tab is selected...
		ots.core.oneTime.onFavTabSelected($favTab, function(event) {
			var	tabText = $(event.item).text();

			// Ensure that FF is only displayed for the appropriate tabs			
			$li.toggle(ots.core.containsSubstring(tabText, 'personal') || ots.core.containsSubstring(tabText, 'team'));
			
			// Blank out search box and re-run filter which will make all rows visible
			$searchBox.val('');
			runFilter();
		});


		// --- Helper functions --- 

		function rowsOfCurrentTab() {
			return $favTab.find('.t-content.t-state-active .t-grid-content table tbody tr');
		}
		
		function runFilter() {
			var text = $searchBox.val().trim();

			rowsOfCurrentTab().each(function() {
				var $row = $(this);
				$row.toggle(!text || ots.core.containsSubstring($row.text(), text));
			});
		};
	}


	/**
	 * Days are marked as being incomplete if their week is incomplete and they don't satisfy the daily quota.
	 * Future days are optionally included.
	 */
	function enableIncompleteDayHighlighting($calendar, calendar, $weekGrid, includeFutureDays) {
		$calendar.bind('navigate change', highlightIncompleteDays);
		$weekGrid.bind('dataBound', highlightIncompleteDays);
		highlightIncompleteDays();


		function highlightIncompleteDays() {
			if (!ots.core.oneTime.calendarIsInStandardMode(calendar))
				return;

			// Fetch a representation of the weeks currently displayed in the calendar. We'll be working with these
			var weeksInCalendar = ots.core.oneTime.getWeeksInDisplayedCalendar($calendar, calendar),
				firstWeek = _.first(weeksInCalendar)[0].date,
				lastWeek = _.last(weeksInCalendar)[0].date,
				tomorrow = ots.core.dates.zeroDate(ots.core.dates.addDays(ots.core.dates.getDateNow(), 1));

			// Fetch timesheets correspond to above weeks
			ots.core.oneTime.getWeeksOfTimesheets(firstWeek, lastWeek)
				.done(function(weeksOfTimesheets) {
					// Zip weeks in calendar against weeks of timesheets and process each individually
					_.chain(weeksInCalendar)
						.zip(weeksOfTimesheets)
						.map(function(week) {
							return {
								weekOfTimesheets: week[1],
								$dayTds: _.map(week[0], '$td')
							};
						})
						.each(processWeek);
				});


			function processWeek(week) {
				if (!week.weekOfTimesheets.isIncomplete) {
					// If week is complete, we can safely mark all of its days as complete
					_.each(week.$dayTds, function($td) { $td.removeClass('incomplete'); });
				} else {
					// Otherwise, we must zip days of timesheets against days in the calendar
					// and process each day individually.
					_.chain(week.$dayTds)
						.zip(week.weekOfTimesheets.days)
						.map(function(day) {
							return {
								date: day[1].date,
								isIncomplete: day[1].isIncomplete,
								$td: day[0]
							};
						})
						.filter(function(day) {
							return includeFutureDays || day.date < tomorrow;
						})
						.each(function(day) {
							day.$td.toggleClass('incomplete', day.isIncomplete);
						})
						.value();
				}
			}
		}
	}


	/**
	 * Our CSS relies on public holidays being addressable. Hence this.
	 */
	function fixCalendarClasses($calendar, $weekGrid) {
		$calendar.bind('change navigate', fix);
		$weekGrid.bind('dataBound', fix);
		fix();


		function fix() {
			$calendar.find('table tbody tr td > a.t-action-link').each(function() { $(this).parent().addClass('public-holiday'); });
		}
	}


	function addHeader(optionsUrl) {
		var $titleContainer = $('#titleContainer');

		// Remove 'Nathan Pitman -' portion. Slightly tricky, as it doesn't reside inside its own element.
		$titleContainer.find('#headingText').parent()
			.contents()
			.filter(function() {
				return this.nodeType === 3 && $(this).nextAll('#headingText').length;
			})
			.remove();

		// Make header menus and Help button a bit more narrow - they're occupying valuable real estate.
		$titleContainer.find('#helpFileBtn, ul.t-widget > li').width(97);

		// Build HTML for What's New dialog
		var 
			listItemsTemplate = _.template(
				'{{ _.each(data, function (item) { }}' + 
					'<li {{ if (item.explanation) { }} class="no-bullet" {{ } }}>' +
						'{{ if (item.explanation) { }}' + 
							'<details>' + 
								'<summary> {{= item.description }}</summary>' +
								'{{= item.explanation }}' +
							'</details>' +
						'{{ } else { }}' +
							'{{= item.description }}' + 
						'{{ } }}' +
					'</li>' + 
				'{{ }) }}', { variable: 'data' }),

			whatsNewTemplate = _.template(
				'<div class="whats-new-dialog">' + 
					'<h2>What\'s new in v2?</h2>' + 

					'<h3>Enhancements</h3>' + 
					'<ul>' + 
						'{{= listItemsTemplate(enhancements) }}' + 
					'</ul>' + 

					'<h3>Bugfixes</h3>' + 
					'<ul>' + 
						'{{= listItemsTemplate(bugfixes) }}' + 
					'</ul>' + 

					'<div class="dismiss">' +
						'<a href="javascript:void(0)">Dismiss</a>' +
						'<div class="ots-clear"></div>' +
					'</div>' +
				'</div>'),

			whatsNewHtml = whatsNewTemplate({
				enhancements: [
					{ 
						description: 'Added \'Find incomplete day\' button.',
						explanation: 'Allows you to cycle through incomplete days from the past few months and ' +
							'(optionally) from the upcoming month.'
					},
					{ 
						description: 'Added option to allow week grid clicking to trigger a month change.',
						explanation: 'Enabled by default.'
					},
					{ 
						description: 'Added option to allow text to wrap in tables.',
						explanation: 'Disabled by default.'
					}
				],
				bugfixes: [
					{ description: 'Fixed bug where multiple calendar days would be highlighted as \'Today\' when ' + 
							'OneTime was left open overnight.' },
					{ description: 'Fixed bug where days near the end of the month would never be marked as incomplete.' },
					{ description: 'Fixed calendar highlighting bugs.' },
					{ description: 'Fixed miscellaneous timing bugs.' }
				],
				listItemsTemplate: listItemsTemplate
			});

		// Render dialog to DOM
		var $whatsNewDialog = $(whatsNewHtml)
			.appendTo($('#main'))
			.hide()
			.find('.dismiss a')
			.click($.unblockUI)
			.end();


		// Add OTS header
		$('<span id="ots-header">' + 
			'<span id="modded-with">Modded with </span>OneTime Sublime v2.4 ' +
			'<span class="links">' + 
				'( <a href="' + optionsUrl + '" target="_blank">options</a> / ' + 
				'<a href="https://github.com/Seltzer/onetime-sublime" target="_blank">docs</a> / ' + 
				'<a href="javascript:void(0);" class="whats-new">what\'s new</a> )' + 
			'</span>' + 
		  '</span>')
			.appendTo($titleContainer)
			.find('.whats-new')
			.click(function() {
				$.blockUI({
					message: $whatsNewDialog,
					css: {
						cursor: 'default',
						textAlign: 'left',
						top: '20%'
					},
					overlayCSS: {
						cursor: 'default'
					}
				});

				$('.blockOverlay').attr('title','Click to return to OneTime').click($.unblockUI);
			});
	}


	/**
	 * Write certain config state as data attributes to DOM. Our CSS relies on them.
	 */
	function writeConfigToDom(otsConfig) {
		var $html = $('html');
		
		$html.attr({
			'data-today-highlighting-enabled': otsConfig.enableTodayHighlighting,
			'data-incomplete-day-highlighting-enabled': otsConfig.enableIncompleteDayHighlighting
		});
	}


	/**
	 * Enables text wrapping in the bodies of tables rendered in the Personal / Team tabs (in Favourites Panel)
	 * and the timesheet grid.
	 */
	function enableTableTextWrapping($favTab, $timesheetGrid) {
		ots.core.oneTime.onFavTabSelected($favTab, function(event) {
			var	tabText = $(event.item).text();

			if (ots.core.containsSubstring(tabText, 'personal') || ots.core.containsSubstring(tabText, 'team')) 
				modifyFavPanel();
		});

		$timesheetGrid.bind('dataBound', modifyTimesheetGrid);

		modifyFavPanel();
		modifyTimesheetGrid();


		function modifyFavPanel() {
			modifyTable($favTab.find('.t-content.t-state-active table'));
		}

		function modifyTimesheetGrid() {
			modifyTable($timesheetGrid.find('.t-grid-content table'));
		}

		function modifyTable($table) {
			$table.find('tbody tr td').each(function() { $(this).css('white-space', 'normal'); });
		}
	}


	/**
	 * Activates the 'Find Incomplete Day' button. Behaviour:
	 *     - The first time it is pressed, jump to the first incomplete day in the last few months
	 *     - Subsequent presses should cycle through other incomplete days
	 *     - When the user fills in any timesheet data, we mark our incompleteness state is invalid / stale and retrieve
	 *       some more. We try to set the pointer to be temporally close to where it previously resided.
	 */
	function enableFindIncompleteDay($calendar, calendar, includeFutureDays) {
		// Keep track of incomplete days and maintain a pointer to the current one
		var	incompleteDays = null,
			index = null,
			dateAtIndex = null;

		// Eagerly fetch data so that there's no delay upon first press
		getIncompleteDaysAndSetPointer();

		$('#saveBtn, #copyTimesheetBtn span, #deleteTimesheetBtn span').click(function() {
			// Invalidate incompleteness state
			incompleteDays = null;
		});

		$('<button id="find-incomplete-day" class="button">Find incomplete day</button>')
			.insertAfter($('#today'))
			.click(function() {
				if (incompleteDays === null) {
					getIncompleteDaysAndSetPointer()
						.done(function() {
							if (incompleteDays.length) 
								selectDayAndIncrementPointer();
						});
				} else if (incompleteDays.length) {
					selectDayAndIncrementPointer();
				}
			});


		function getIncompleteDaysAndSetPointer() {
			var	
				today = ots.core.dates.zeroDate(ots.core.dates.getDateNow()),
				start = ots.core.dates.addMonths(today, -3),
				end = includeFutureDays ? ots.core.dates.addMonths(today, 1) : today,
				firstMonday = ots.core.dates.getWeekStart(start),
				lastMonday = ots.core.dates.getWeekStart(end);

			return ots.core.oneTime.getWeeksOfTimesheets(firstMonday, lastMonday)
				.pipe(function(weeks) {
					// Get flat list of timesheet days corresponding to specified weeks.
					var daysInPeriod = _.chain(weeks)
						.map(function(week) { return week.days; })
						.flatten()
						.filter(function(day) { return day.date >= start && day.date <= end; })
						.value();

					// Interesting dilemma here regarding new employees. We don't want to jump to dates prior to when
					// they started, but at the same time we have no way of knowing when they started. We're solving
					// this edge case by including only incomplete days which follow a non-empty day. Consequences:
					//    1.) Find Incomplete Day will not work for a new employee until they've filled in a timesheet.
					//    2.) Employees who go on leave for longer than three months will have a similar issue.
					//    3.) A contiguous incomplete cluster at the start of three months will be a blind spot.
					var firstNonEmptyDay = _.findIndex(daysInPeriod, function (day) { return day.hours > 0; });
					if (firstNonEmptyDay !== -1) 
						daysInPeriod = _.rest(daysInPeriod, firstNonEmptyDay);

					incompleteDays = _.filter(daysInPeriod, function(day) { return day.isIncomplete; });

					if (dateAtIndex) {
						var matchingIndex = _.findIndex(incompleteDays, function(day) {
							return day.date >= dateAtIndex;
						});

						if (matchingIndex !== -1) {
							index = matchingIndex;
							dateAtIndex = incompleteDays[matchingIndex].date;

							return $.Deferred().resolve();
						} 
					}
					
					index = 0;
					dateAtIndex = incompleteDays.length ? incompleteDays[index].date : null;

					return $.Deferred().resolve();
				});
		}

		
		function selectDayAndIncrementPointer() {
			ots.core.oneTime.selectDayInCalendar($calendar, calendar, incompleteDays[index].date, true);
			index = (index + 1) % incompleteDays.length;
			dateAtIndex = incompleteDays[index].date;
		}
	}


	// Initialise
	$(function() {
		var config = $('#ots-config').data('ots-config');

		_.templateSettings = {
			evaluate:    /\{\{(.+?)\}\}/g,
			interpolate: /\{\{=(.+?)\}\}/g,
			escape:      /\{\{-(.+?)\}\}/g
		};

		addHeader(config.optionsUrl);

		// Obtain DOM elements and Telerik components on page
		var $cal = $('#cal'),
			cal = $cal.data('tCalendar'),
			$weekGrid = $('#weekgrid'),
			weekGrid = $weekGrid.data('tGrid'),
			$favTab = $('#favTab'),
			// Huge grid down the bottom which occupies the entire width
			$timesheetGrid = $('#timesheetgrid');

		// Some of our CSS is conditional based on config. So we'll persist it to the DOM as data attributes
		writeConfigToDom(config);

		// Disable calendar animation. It looks nicer and saves us from trying to detect when it has finished.
		cal.stopAnimation = true;


		// Activate features based on config

		if (config.enableFavouritesFiltering)
			enableFavouritesFiltering($favTab);

		if (config.enableIncompleteDayHighlighting || config.enableTodayHighlighting) {
			// If we're doing any sort of day highlighting, we need to fix the classes on the calendar so that
			// public holidays are marked.
			fixCalendarClasses($cal, $weekGrid);

			if (config.enableIncompleteDayHighlighting)
				enableIncompleteDayHighlighting($cal, cal, $weekGrid, config.includeFutureDays);

			if (config.enableTodayHighlighting)
				enableTodayHighlighting($cal, cal, $weekGrid);
		}

		if (config.enableWeekGridClicking)
			enableWeekGridClicking($cal, cal, $weekGrid, weekGrid, config.allowMonthChange);

		if (config.enableTableTextWrapping)
			enableTableTextWrapping($favTab, $timesheetGrid);

		if (config.enableFindIncompleteButton)
			enableFindIncompleteDay($cal, cal, config.includeFutureDays);
	});

}(jQuery));

