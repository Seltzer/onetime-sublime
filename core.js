/**
 * Define ots empty module
 */
var ots = {
};


/**
 * Define ots.core module (but not sub-modules)
 */
ots.core = (function() {

	return {
		/**
		 * ots.core.TimesheetCompleteness enum
		 *
		 * Represents completeness of a day with respect to OneTime standard quotas. By default, these
		 * are 7.5h for weekdays and 0h for weekends. Accounts for week completeness.
		 */
		TimesheetCompleteness: {
			Blank: 'blank',
			
			// The day is not blank and the week is incomplete
			PartiallyComplete: 'partially-complete',
			
			// The day and/or its week are complete
			Complete: 'complete',
			
			Exceeded: 'exceeded'
		},

		
		/**
		 * @param caseSensitive - Defaults to false (case insensitive)
		 */
		containsSubstring: function(stringToSearch, substring, caseSensitive) {
			return !!caseSensitive
				? stringToSearch.indexOf(substring) !== -1
				: stringToSearch.toLowerCase().indexOf(substring.toLowerCase()) !== -1;
		},

		
		/**
		 * unfold is the opposite of fold (or reduce in Underscore world). It starts with a single value
		 * and returns an array of values. The specified seed is the first value, and more values
		 * are generated by feeding the last generated value into generator. Generation continues while
		 * all values generated satisfy the specified predicate.
		 *
		 * NB: Return value for base case is [] (if seed doesn't specify predicate)
		 */
		unfold: function(seed, generator, predicate) {
			var returnValue = [],
				current = seed;

			while (predicate(current)) {
				returnValue.push(current);
				current = generator(current);
			}
			
			return returnValue;
		},


		computeDayCompleteness: function(date, hoursLogged, weekIsComplete) {
			var dailyQuota = ots.core.dates.isWeekDay(date) ? parseFloat(showjobsOptions.stdHours) : 0;
			
			if (hoursLogged > dailyQuota)
				return ots.core.TimesheetCompleteness.Exceeded;

			if (weekIsComplete || hoursLogged === dailyQuota)
				return ots.core.TimesheetCompleteness.Complete;

			return hoursLogged > 0
				? ots.core.TimesheetCompleteness.PartiallyComplete
				: ots.core.TimesheetCompleteness.Blank;
		}
	};
}());



/**
 * Define ots.core.dates module - contains generic JS date helpers for the most part.
 */
ots.core.dates = (function() {
	
	return {
		/**
		 * This exists for testing purposes.
		 */
		getDateNow: function() {
			return new Date();
		},

		
		isWeekDay: function(date) {
			return this.getNormalisedDayOfWeek(date) < 5;
		},

		
		areSameDay: function(date1, date2) {
			return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
				&& date1.getDate() === date2.getDate();
		},


		/**
		 * getDay() return a number in the range 0-6 where 0 corresponds to Sunday. We want 0 to be Monday, hence this.
		 */
		getNormalisedDayOfWeek: function(date) {
			return (date.getDay() + 6) % 7;
		},

		
		/**
		 * @returns Date corresponding to the start of the week to which the specified date belongs. Weeks start on Monday
		 */ 
		getWeekStart: function(date) {
			var dayOfWeek = ots.core.dates.getNormalisedDayOfWeek(date);

			return ots.core.dates.zeroDate(ots.core.dates.addDays(date, -dayOfWeek));
		},


		/**
		 * @returns Date corresponding to the start of the month to which the specified date belongs. 
		 */ 
		getMonthStart: function(date) {
			return new Date(date.getFullYear(), date.getMonth());
		},

		
		/**
		 * Non-mutating way to add/subtract months to/from a JS date.
		 *
		 * @param monthsToAdd Can be negative
		 */
		addMonths: function(date, monthsToAdd) {
			var returnDate = new Date(date);
			returnDate.setMonth(returnDate.getMonth() + monthsToAdd);

			return returnDate;
		},


		/**
		 * Non-mutating way to add/subtract days to/from a JS date.
		 *
		 * @param daysToAdd Can be negative
		 */
		addDays: function(date, daysToAdd) {
			var returnDate = new Date(date);
			returnDate.setDate(returnDate.getDate() + daysToAdd);

			return returnDate;
		},


		/**
		 * Non-mutating way to zero the time component of a JS date.
		 */
		zeroDate: function(date) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate());
		}
	};
}());




/**
 * Define ots.core.oneTime module - contains helpers which work with the OneTime DOM and call its API
 */
ots.core.oneTime = (function() {
	
	return {
		calendarIsInStandardMode: function(calendar) {
			return calendar.currentView.index === 0;
		},


		/**
		 * Call this to subscribe to the event of a Favourites tab being selected.
		 *
		 * TODO: Should probably trigger our own event instead, rather than requiring that this function be called.
		 */
		onFavTabSelected: function($favTab, handler) {
			if (!$favTab)
				throw 'Must specify $favTab';
			
			$favTab.bind('select', function(event) {
				// This event seems to fire with no item when you press <SHIFT> + <DEL> / <LEFT> / <RIGHT> in the favourites filter. 
				// It's unwanted.
				if (!event.item)
					return;
				
				handler(event);
			});
		},

		
		selectDayInCalendar: function($calendar, calendar, day, allowMonthChange) {
			var calendarMonth = calendar.viewedMonth.toDate(),
				monthOffset = day.getMonth() - calendarMonth.getMonth();

			if (monthOffset !== 0) {
				if (!allowMonthChange)
					return;
			
				calendar.navigateHorizontally(0, ots.core.dates.getMonthStart(day), monthOffset > 0);
			}


			// If we want to emulate calendar behaviour, the safest way (least likely to break when OneTime is updated)
			// is to simulate a calendar click.
			var dayInCalendar = ots.core.oneTime.getDayInDisplayedCalendar($calendar, calendar, day);

			// This shouldn't happen.
			if (!dayInCalendar) 
				return;

			dayInCalendar.$td.children('a').click();

			// But for reasons unknown the event triggered by the above simulated click has the incorrect srcElement, 
			// causing calendar highlighting to break. So we'll have to do it manually.
			if (typeof(HighlightCalendarWeek) !== 'undefined')
				HighlightCalendarWeek(dayInCalendar.$td);
		},


		/**
		 * Returns nested arrays, where the outer array corresponds to weeks and the inner to days starting with Monday
		 */
		getWeeksInDisplayedCalendar: function($calendar, calendar) {
			var firstDayOfCurrentMonth = calendar.viewedMonth.toDate(),
				$mondays = $calendar.find('table tbody tr td:first-child');
			
			return _.map($mondays, function (monday) {
				var $monday = $(monday),
					$weekDays = $monday.add($monday.nextAll());

				return _.map($weekDays, function (wd) {
					var $wd = $(wd),
						day = parseInt($wd.text()),
						isPrevMonth = $wd.hasClass('t-other-month') && day > 15,
						isNextMonth = !isPrevMonth && $wd.hasClass('t-other-month') && day < 15;

					// Compute date corresponding to selected day
					var date = new Date(firstDayOfCurrentMonth);
					if (isPrevMonth)
						date.setMonth(date.getMonth() - 1);
					if (isNextMonth)
						date.setMonth(date.getMonth() + 1);

					date.setDate(day);
					
					// Return day
					return {
						$td: $wd,
						date: date
					};
				});
			});
		},


		/**
		 * @returns An object like that returned by getWeeksInDisplayedCalendar
		 */
		getDayInDisplayedCalendar: function($calendar, calendar, date) {
			var weeksInDisplayedCalendar = ots.core.oneTime.getWeeksInDisplayedCalendar($calendar, calendar);

			return _.chain(weeksInDisplayedCalendar)
				.flatten()
				.find(function(day) { return ots.core.dates.areSameDay(day.date, date); })
				.value();
		},


		/**
		 * Fetches timesheets between the specified dates in units of weeks
		 *
		 * @return Array of week objects (see below for structure)
		 */
		getWeeksOfTimesheets: function(start, end) {
			// Prepare
			end = end || ots.core.dates.getDateNow();
			if (start > end)
				throw 'start must be <= end';

			// Figure out which weeks we're interested in
			var 
				firstMonday = ots.core.dates.getWeekStart(start),
				lastMonday = ots.core.dates.getWeekStart(end),
				weeks = ots.core.unfold(firstMonday, 
					 function(week) { return ots.core.dates.addDays(week, 7); },
					 function(week) { return week <= lastMonday; });

			// Accordingly, in order to cover above range, figure out which months of timesheets we must retrieve
			var
				firstMonth = ots.core.dates.getMonthStart(firstMonday),
				lastMonth = ots.core.dates.getMonthStart(ots.core.dates.addDays(lastMonday, 6)),
				months = ots.core.unfold(firstMonth, 
					 function(month) { return ots.core.dates.addMonths(month, 1); },
					 function(month) { return month <= lastMonth; });
	
			// For each month to retrieve, call the OneTime API
			var deferredResults = _.map(months, getTimesheetData);

			// When all calls resolve...				 
			return $.when.apply($, deferredResults)
				.pipe(function () {
					// Required to deal with an annoying inconsistency of $.when, where it flattens its result when there's only one.
					var results = deferredResults.length > 1 ? arguments : [arguments];
						
					// Aggregate and flatten timesheets received from n calls, then group them by a real JS date, not the stringly typed
					// date we received from the API
					var timesheets = _.chain(results)
						.map(function (result) { return result[0].data; })
						.flatten()
						.groupBy(function(entry) {
							var dateComponents = entry.Date.split('/');
							return new Date(dateComponents[2], dateComponents[1] - 1, dateComponents[0]);
						})
						.value();

					var returnObj = _.chain(weeks)
						.map(function(week) {
							var daysOfWeek =  _.times(7, function(i) { return ots.core.dates.addDays(week, i); }),
								hours = _.map(daysOfWeek, function(day) {
									return _.reduce(timesheets[day] || [], function(total, ts) { return total + ts.Duration; }, 0);
								}),
								weekHours = _.reduce(hours, function(total, h) { return total + h; }, 0),
								weekIsComplete = weekHours >= showjobsOptions.stdHoursPerWeek;
				 
							return {
								week: week,
								isIncomplete: !weekIsComplete,
								days: _.chain(daysOfWeek)
									.zip(hours)
									.map(function(x) {
										return {
											date: x[0],
											hours: x[1],
											completeness: ots.core.computeDayCompleteness(x[0], x[1], weekIsComplete)
										};
									})
									.value()
							};
						})
						.value();

					return $.Deferred().resolve(returnObj);
				});


			// Helper for obtaining timesheet data
			function getTimesheetData(date) {
				var dateString = $.telerik.formatString('{0:MM/dd/yyyy}', date);

				var url = '/Home/_selectdate?date='	+ $.URLEncode(dateString) + '&UserName=' + showjobsOptions.userName
					+ '&viewType=' + 'View%20Month' + '&ots';

				return $.post(url, {});
			}
		}
	};
}());




/**
 * Define ots.core.analytics module
 */
ots.core.analytics = (function() {
	var
		enabled = false,
		$analytics,
		session,
		uid,
		scrambleShift = 13;


	function scramble(str) {
		var result = "";
		
		for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			if (c >= 65 && c <=  90) 
				result += String.fromCharCode((c - 65 + scrambleShift) % 26 + 65);
			else if (c >= 97 && c <= 122) 
				result += String.fromCharCode((c - 97 + scrambleShift) % 26 + 97);
			else
                result += str.charAt(i);
		}

		return result.split('').reverse().join('');
	}
	



	return {
		initialise: function() {
			if (document.location.protocol === 'https:')
				return;

			enabled = true;
			
			$analytics = $('<div id="ots-analytics"></div>').appendTo($('body'));

			session = new Date().getTime();
			uid = scramble(showjobsOptions.userName);

			ots.core.analytics.record('load');
		},


		record: function(type, data) {
			if (!enabled)
				return;
		
			data = data || {};
			data.ts = new Date().getTime();
			data.s = session;
			data.u = uid;
			data.type = type;
		
			var qs = _.chain(data)
				.map(function(v, k) { return $.URLEncode(k) + '=' + $.URLEncode(v); })
				.reduce(function(str, qsPair, i) { return str + (i === 0 ? '?' : '&') + qsPair; }, '')
				.value();

			var url = 'http://thesoftwarecondition.com/spi.gif' + qs;

			$analytics.html('<img src="' + url + '"></img>');
		}
	};
}());
