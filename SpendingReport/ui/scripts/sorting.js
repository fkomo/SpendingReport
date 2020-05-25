
// https://www.w3schools.com/howto/howto_js_sort_table.asp
function SortTable(tableId, rowClass, columnClass, columnId, compareAs) {

	// TODO CODE optimize sort - https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value

	if (compareAs == 'number')
		SortTableAsNumber(tableId, rowClass, columnClass, columnId);
	else if (compareAs == 'float')
		SortTableAsFloat(tableId, rowClass, columnClass, columnId);
	else if (compareAs == 'dateTime')
		SortTableAsDateTime(tableId, rowClass, columnClass, columnId, null);
	else if (compareAs == 'date')
		SortTableAsDate(tableId, rowClass, columnClass, columnId, null);
	else
		SortTableAsString(tableId, rowClass, columnClass, columnId);
}

function ParseDateTime(dateTimeString) {

	//var reggie = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/;
	var reggie = /(\d{2}). (\d{2}). (\d{4}) (\d{2}):(\d{2})/;

	var dateArray = reggie.exec(dateTimeString);
	return new Date(
		(+dateArray[3]),
		(+dateArray[2]) - 1, // Careful, month starts at 0!
		(+dateArray[1]),
		(+dateArray[4]),
		(+dateArray[5])
	);
}

function ParseDate(dateString) {

	var reggie = /(\d{4})-(\d{2})-(\d{2})/;
	//var reggie = /(\d{2}). (\d{2}). (\d{4})/;

	var dateArray = reggie.exec(dateString);
	return new Date(
		(+dateArray[3]),
		(+dateArray[2]) - 1, // Careful, month starts at 0!
		(+dateArray[1])
	);
}

function SortTableAsNumber(tableId, rowClass, columnClass, columnId) {

	var switchcount = 0;
	var table = document.getElementById(tableId);
	var switching = true;

	// Set the sorting direction to ascending:
	var dir = 'asc';
	// Make a loop that will continue until no switching has been done:
	while (switching) {

		// start by saying: no switching is done:
		switching = false;
		var rows = table.getElementsByClassName(rowClass);

		var shouldSwitch;

		// Loop through all table rows
		for (var i = 0; i < (rows.length - 1) ; i++) {
			// start by saying there should be no switching:
			shouldSwitch = false;
			// Get the two elements you want to compare, one from current row and one from the next:
			var x = rows[i].getElementsByClassName(columnClass)[columnId];
			var y = rows[i + 1].getElementsByClassName(columnClass)[columnId];

			if (x.innerHTML == '&nbsp;' && y.innerHTML == '&nbsp;')
				continue;

			// check if the two rows should switch place, based on the direction, asc or desc:
			if (dir == 'asc') {
				if (y.innerHTML == '&nbsp;' || parseInt(x.innerHTML) > parseInt(y.innerHTML)) {
					// if so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			} else if (dir == 'desc') {
				if (x.innerHTML == '&nbsp;' || parseInt(x.innerHTML) < parseInt(y.innerHTML)) {
					shouldSwitch = true;
					break;
				}
			}
		}

		if (shouldSwitch) {

			// If a switch has been marked, make the switch and mark that a switch has been done:
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;

			// Each time a switch is done, increase this count by 1
			switchcount++;
		} else {

			// If no switching has been done AND the direction is 'asc' set the direction to 'desc' and run the while loop again.
			if (switchcount == 0 && dir == 'asc') {
				dir = 'desc';
				switching = true;
			}
		}
	}
}

function SortTableAsFloat(tableId, rowClass, columnClass, columnId) {

	var switchcount = 0;
	var table = document.getElementById(tableId);
	var switching = true;

	// Set the sorting direction to ascending:
	var dir = 'asc';
	// Make a loop that will continue until no switching has been done:
	while (switching) {

		// start by saying: no switching is done:
		switching = false;
		var rows = table.getElementsByClassName(rowClass);

		var shouldSwitch;

		// Loop through all table rows
		for (var i = 0; i < (rows.length - 1) ; i++) {
			// start by saying there should be no switching:
			shouldSwitch = false;
			// Get the two elements you want to compare, one from current row and one from the next:
			var x = rows[i].getElementsByClassName(columnClass)[columnId];
			var y = rows[i + 1].getElementsByClassName(columnClass)[columnId];

			if (x.innerHTML == '&nbsp;' && y.innerHTML == '&nbsp;')
				continue;

			// check if the two rows should switch place, based on the direction, asc or desc:
			if (dir == 'asc') {
				if (y.innerHTML == '&nbsp;' || parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
					// if so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			} else if (dir == 'desc') {
				if (x.innerHTML == '&nbsp;' || parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
					shouldSwitch = true;
					break;
				}
			}
		}

		if (shouldSwitch) {

			// If a switch has been marked, make the switch and mark that a switch has been done:
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;

			// Each time a switch is done, increase this count by 1
			switchcount++;
		} else {

			// If no switching has been done AND the direction is 'asc' set the direction to 'desc' and run the while loop again.
			if (switchcount == 0 && dir == 'asc') {
				dir = 'desc';
				switching = true;
			}
		}
	}
}

function SortTableAsString(tableId, rowClass, columnClass, columnId) {

	var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
	table = document.getElementById(tableId);
	switching = true;

	// Set the sorting direction to ascending:
	dir = 'asc';
	// Make a loop that will continue until no switching has been done:
	while (switching) {

		// start by saying: no switching is done:
		switching = false;
		rows = table.getElementsByClassName(rowClass);

		// Loop through all table rows
		for (i = 0; i < (rows.length - 1) ; i++) {
			// start by saying there should be no switching:
			shouldSwitch = false;
			// Get the two elements you want to compare, one from current row and one from the next:
			x = rows[i].getElementsByClassName(columnClass)[columnId];
			y = rows[i + 1].getElementsByClassName(columnClass)[columnId];

			if (x.innerHTML == '&nbsp;' && y.innerHTML == '&nbsp;')
				continue;

			// check if the two rows should switch place, based on the direction, asc or desc:
			if (dir == 'asc') {
				if (x.innerHTML > y.innerHTML) {
					shouldSwitch = true;
					break;
				}
			} else if (dir == 'desc') {
				if (x.innerHTML < y.innerHTML) {
					shouldSwitch = true;
					break;
				}
			}
		}

		if (shouldSwitch) {

			// If a switch has been marked, make the switch and mark that a switch has been done:
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;

			// Each time a switch is done, increase this count by 1
			switchcount++;
		} else {

			// If no switching has been done AND the direction is 'asc' set the direction to 'desc' and run the while loop again.
			if (switchcount == 0 && dir == 'asc') {
				dir = 'desc';
				switching = true;
			}
		}
	}
}

function SortTableAsDateTime(tableId, rowClass, columnClass, columnId, dir) {

	var table, rows, switching, i, x, y, shouldSwitch, switchcount = 0;
	table = document.getElementById(tableId);
	switching = true;

	// Set the sorting direction to ascending:
	if (dir == null)
		dir = 'asc';

	// Make a loop that will continue until no switching has been done:
	while (switching) {

		// start by saying: no switching is done:
		switching = false;
		rows = table.getElementsByClassName(rowClass);

		// Loop through all table rows
		for (i = 0; i < (rows.length - 1) ; i++) {
			// start by saying there should be no switching:
			shouldSwitch = false;
			// Get the two elements you want to compare, one from current row and one from the next:
			x = rows[i].getElementsByClassName(columnClass)[columnId];
			y = rows[i + 1].getElementsByClassName(columnClass)[columnId];

			if (x.innerHTML == '&nbsp;' && y.innerHTML == '&nbsp;')
				continue;

			// check if the two rows should switch place, based on the direction, asc or desc:
			if (dir == 'asc') {
				if (ParseDateTime(x.innerHTML).valueOf() > ParseDateTime(y.innerHTML).valueOf()) {
					shouldSwitch = true;
					break;
				}
			} else if (dir == 'desc') {
				if (ParseDateTime(x.innerHTML).valueOf() < ParseDateTime(y.innerHTML).valueOf()) {
					shouldSwitch = true;
					break;
				}
			}
		}

		if (shouldSwitch) {

			// If a switch has been marked, make the switch and mark that a switch has been done:
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;

			// Each time a switch is done, increase this count by 1
			switchcount++;
		} else {

			// If no switching has been done AND the direction is 'asc' set the direction to 'desc' and run the while loop again.
			if (switchcount == 0 && dir == 'asc') {
				dir = 'desc';
				switching = true;
			}
		}
	}
}

function SortTableAsDate(tableId, rowClass, columnClass, columnId, dir) {

	var table, rows, switching, i, x, y, shouldSwitch, switchcount = 0;
	table = document.getElementById(tableId);
	switching = true;

	// Set the sorting direction to ascending:
	if (dir == null)
		dir = 'asc';

	// Make a loop that will continue until no switching has been done:
	while (switching) {

		// start by saying: no switching is done:
		switching = false;
		rows = table.getElementsByClassName(rowClass);

		// Loop through all table rows
		for (i = 0; i < (rows.length - 1) ; i++) {
			// start by saying there should be no switching:
			shouldSwitch = false;
			// Get the two elements you want to compare, one from current row and one from the next:
			x = rows[i].getElementsByClassName(columnClass)[columnId];
			y = rows[i + 1].getElementsByClassName(columnClass)[columnId];

			if (x.innerHTML == '&nbsp;' && y.innerHTML == '&nbsp;')
				continue;

			// check if the two rows should switch place, based on the direction, asc or desc:
			if (dir == 'asc') {
				if (ParseDate(x.innerHTML).valueOf() > ParseDate(y.innerHTML).valueOf()) {
					shouldSwitch = true;
					break;
				}
			} else if (dir == 'desc') {
				if (ParseDate(x.innerHTML).valueOf() < ParseDate(y.innerHTML).valueOf()) {
					shouldSwitch = true;
					break;
				}
			}
		}

		if (shouldSwitch) {

			// If a switch has been marked, make the switch and mark that a switch has been done:
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;

			// Each time a switch is done, increase this count by 1
			switchcount++;
		} else {

			// If no switching has been done AND the direction is 'asc' set the direction to 'desc' and run the while loop again.
			if (switchcount == 0 && dir == 'asc') {
				dir = 'desc';
				switching = true;
			}
		}
	}
}