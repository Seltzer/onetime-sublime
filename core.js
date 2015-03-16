var ots = {};

/**
 * Contains:
 *   - JS utility functions... mostly date related because the JS date API is terribad.
 *   - Useful OneTime specific things
 */
ots.core = (function() {

	return {
		/**
		 * This exists for testing purposes.
		 */
		getDateNow: function() {
			return new Date();
		},

		
		isWeekDay: function(date) {
			return !!(date.getDay() % 6);
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
			var weeksInDisplayedCalendar = ots.core.getWeeksInDisplayedCalendar($calendar, calendar);

			return _.chain(weeksInDisplayedCalendar)
				.flatten()
				.find(function(day) { 
					return day.date.getFullYear() === date.getFullYear() && day.date.getMonth() === date.getMonth() 
						&& day.date.getDate() === date.getDate();
				})
				.value();
		},


		/**
		 * Gets months of timesheets between specified dates. Returns a promise.
		 * 
		 * @returns A promise, whose value is an object where the keys are JS dates (with year/month/day and zeroed time), 
		 * and the values are arrays of timesheets returned via the OneTime API
		 */
		getMonthsOfTimesheets: function(from, to) {
			// Prepare
			to = to || ots.core.getDateNow();
			if (from > to)
				throw 'from must be <= to';

			// Compute monthStarts, an array of dates corresponding to the starts of months of timesheets we want to retrieve
			var firstMonth = new Date(from.getFullYear(), from.getMonth()),
				lastMonth = new Date(to.getFullYear(), to.getMonth());

			var monthStarts = [],
				date = new Date(firstMonth);
			
			// Apology: this is slightly nasty and could be more nicely expressed if Underscore JS had an unfold function
			do {
				monthStarts.push(date);
				date = new Date(date);
				date.setMonth(date.getMonth() + 1);
			} while (date <= lastMonth);
			
			// For each month to retrieve, call the OneTime API
			var deferredResults = _.map(monthStarts, getTimesheetData);

			// When all calls resolve...
			return $.when.apply($, deferredResults)
				.pipe(function () {
					// Aggregate and flatten timesheets received from n calls, then group them by a real JS date, not the stringly typed
					// date we received from the API
					var timesheets = _.chain(arguments)
						.map(function (result) { return result[0].data; })
						.flatten()
						.groupBy(function(entry) {
							var dateComponents = entry.Date.split('/');
							return new Date(dateComponents[2], dateComponents[1] - 1, dateComponents[0]);
						})
						.value();

					return $.Deferred().resolve(timesheets);
				});


			// Helper for obtaining timesheet data
			function getTimesheetData(date) {
				var dateString = $.telerik.formatString('{0:MM/dd/yyyy}', date);

				var url = '/Home/_selectdate?date='	+ $.URLEncode(dateString) + '&UserName=' + showjobsOptions.userName
					+ '&viewType=' + 'View%20Month';

				return $.post(url, {});
			}
		}
	};

}());
