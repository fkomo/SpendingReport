
// TODO UI add hide/show all buttons to input-files-content

// TODO FEATURE min/max/avg/count in transactions panel
// TODO FEATURE update spending reports based on transaction filter ?
// TODO FEATURE group by month/quarter/halfyear/year/all...
// TODO FEATURE add tags from selected text - https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection

// TODO CODE optimize chart redraw while moving split
// TODO CODE unify transaction processing/filtering/...
// TODO CODE simplify/unify html page structure - show h1 only if content present - check padding/margins of main regions

// TODO BUG charts are not resizing while moving split to left

function ProcessFile(file) {
	console.log('new file = ' + file.name);

	var fr = new FileReader();

	fr.onload = (function (fileName) {
		return function (e) {

			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(fr.result, "text/xml");

			var invalidSepaFile = false;

			if (xmlDoc.firstChild.nodeName == 'CategoryTags') {

				ProcessCategories(xmlDoc);
				invalidSepaFile = true;

			} else if (xmlDoc.firstChild.nodeName == 'Document') {

				var id = null;
				try {
					id = xmlDoc.firstChild.children[0].children[1].children[0].innerHTML;
				}
				catch (err) {
                    console.log(err);
				}

				var inputFiles = JSON.parse(sessionStorage.getItem('inputFiles'));
				if (id != null && id != '') {
					for (var i = 0; i < inputFiles.length; i++) {
						if (inputFiles[i].FileName == fileName) {
							inputFiles[i].Id = id;
							break;
						}
					}
					sessionStorage.setItem('inputFiles', JSON.stringify(inputFiles));

					LoadAndTransformXml(xmlDoc, 'xslt/sepa-to-spending.xsl', ParseSpendingReport);
				}
				else {
					console.log('invalid sepa xml file ' + fileName);
					invalidSepaFile = true;
				}
			}

			if (invalidSepaFile) {
				var inputFiles = JSON.parse(sessionStorage.getItem('inputFiles'));
				for (var i = 0; i < inputFiles.length; i++) {
					if (inputFiles[i].FileName == fileName) {
						inputFiles.splice(i, 1);
						break;
					}
				}
				sessionStorage.setItem('inputFiles', JSON.stringify(inputFiles));
				sessionStorage.setItem('filesToProcess', JSON.stringify(inputFiles.length));
			}
		};
	})(file.name);

	fr.readAsText(file);
}

function ParseSpendingReport(spendingReportXml) {

	var parser = new DOMParser();
	var spendingReportXmlDoc = parser.parseFromString(spendingReportXml, "text/xml");

	var spendingReportRoot = spendingReportXmlDoc.evaluate('/SpendingReport', spendingReportXmlDoc, null, XPathResult.ANY_TYPE, null).iterateNext();
	var id = spendingReportRoot.getAttribute('Id');
	if (id == null || id == '') {
		console.log('invalid sepa xml file');
		WorkingEnd();
		return;
	}

	var spendingReport = CreateSpendingReport(id);

	// DateTime format: 2018-06-01T00:00:00.0+02:00
	spendingReport.DateTimeFrom = spendingReportRoot.getAttribute('DateTimeFrom');
	spendingReport.DateTimeTo = spendingReportRoot.getAttribute('DateTimeTo');

	var balanceStartDate = null;
	var balanceEndDate = null;

	var balances = spendingReportXmlDoc.evaluate('/SpendingReport/Balance', spendingReportXmlDoc, null, XPathResult.ANY_TYPE, null);
	var balanceNode = balances.iterateNext();
	while (balanceNode) {

		var date = balanceNode.getAttribute('Date');
		if (spendingReport.BalanceStart == null || balanceStartDate > date) {
			spendingReport.BalanceStart = balanceNode.innerHTML;
			balanceStartDate = date;
		}

		if (spendingReport.BalanceEnd == null || balanceEndDate < date) {
			spendingReport.BalanceEnd = balanceNode.innerHTML;
			balanceEndDate = date;
		}

		balanceNode = balances.iterateNext();
	}

	var transactions = spendingReportXmlDoc.evaluate('/SpendingReport/AccountTransactions/Transaction', spendingReportXmlDoc, null, XPathResult.ANY_TYPE, null);
	var transactionNode = transactions.iterateNext();

	while (transactionNode) {
		var transaction = CreateTransaction(transactionNode);

		spendingReport.Transactions.push(transaction);

		transactionNode = transactions.iterateNext();
	}

	SaveSpendingReport(spendingReport);

	var filesToProcess = JSON.parse(sessionStorage.getItem('filesToProcess'));
	filesToProcess--;
	sessionStorage.setItem('filesToProcess', JSON.stringify(filesToProcess));

	if (filesToProcess == 0) {

		// sort spending reports at the end (last file is processed)
		var spendingReports = JSON.parse(sessionStorage.getItem('spendingReports'));
		spendingReports.sort();
		sessionStorage.setItem('spendingReports', JSON.stringify(spendingReports));

		UpdateSpendingReports();
	}
}

function CreateSpendingReport(id) {

	var newSpendingReport = {
		Id: id,
		DateTimeFrom: null,
		DateTimeTo: null,
		BalanceStart: null,
		BalanceEnd: null,
		Enabled: true,
		Transactions: []
	};

	return newSpendingReport;
}

function CreateTransaction(transactionNode) {

	var amount = parseFloat(transactionNode.getAttribute('Amount'));

	var id = transactionNode.getAttribute('Id');

	var allTags = id + ' ';
	for (var i = 0; i < transactionNode.children.length; i++)
		allTags += transactionNode.children[i].innerHTML + ' ';
	allTags = allTags.trim();

	var date = transactionNode.getAttribute('Date');

	return {
		Id: id,
		Date: date,
		Amount: amount,
		Description: allTags,
		DescriptionHtml: null,
		Category: null
	};
}

function WriteSpendingReportToConsole(spendingReport) {

	var balance = 0;
	var categories = JSON.parse(sessionStorage.getItem('categories'));
	for (var c = 0; c < categories.length; c++) {
		var categorySum = CategoryAmountSum(spendingReport, categories[c]).Sum;
		balance += categorySum;

		console.log(categories[c].Name + ' = ' + categorySum.toFixed(2) + ' EUR');
	}
	console.log('balance = ' + balance.toFixed(2) + 'EUR');
}

function CategoryAmountSum(spendingReport, category) {

    var sum = 0;
    var count = 0;
	for (var t = 0; t < spendingReport.Transactions.length; t++) {
		var transaction = spendingReport.Transactions[t];

        if (category == null || (transaction.Category && transaction.Category.Name == category.Name)) {
            sum += transaction.Amount;
            count++;
        }
    }

    return {
        Count: count,
        Sum: sum
    };
}

function SaveSpendingReport(spendingReport) {

	var spendingReports = JSON.parse(sessionStorage.getItem('spendingReports'));
	if (spendingReports == null)
		spendingReports = [];

	if (!spendingReports.includes(spendingReport.Id))
		spendingReports.push(spendingReport.Id);

	sessionStorage.setItem('spendingReports', JSON.stringify(spendingReports));
	sessionStorage.setItem('spendingReport-' + spendingReport.Id, JSON.stringify(spendingReport));
}

function CheckAllTags(categories, description) {

	var tagsFound = [];

	if (categories != null) {
		for (var c = 0; c < categories.length; c++) {
			var category = categories[c];

			if (!IsCategoryEnabled(category.Id))
				continue;

			for (var t = 0; t < category.Tags.length; t++) {
				var tag = category.Tags[t];

				if (description.indexOf(tag) != -1) {

					tagsFound.push({
						Category: category,
						Tag: tag
					});

					break;
				}
			}
		}
	}

	return tagsFound;
}

function ProcessTransactions(spendingReport) {

	var categories = JSON.parse(sessionStorage.getItem('categories'));

	var descriptionTextClass = 'description-text'
		+ (!SettingChecked('showDetailedTransactionCheck') ? ' hidden' : '');

	for (var t = 0; t < spendingReport.Transactions.length; t++) {
		var transaction = spendingReport.Transactions[t];

		var uppedDescription = transaction.Description.toUpperCase();

		transaction.Category = null;
		transaction.DescriptionHtml = transaction.Description;

        var dateParts = transaction.Date.split("-");
        transaction.DateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

		var tagsFound = CheckAllTags(categories, uppedDescription);
		if (tagsFound.length == 1) {

			transaction.Category = tagsFound[0].Category;

			transaction.DescriptionHtml =
				'<div class="' + descriptionTextClass + '">' +
					ReplaceAll(transaction.Description, tagsFound[0].Tag, '</div><div class="tag">' + tagsFound[0].Tag + '</div><div class="' + descriptionTextClass + '">') +
				'</div>';
				
		} else if (tagsFound.length > 1) {

			var message = 'Multiple tags found [' + tagsFound[0].Category.Name + '#' + tagsFound[0].Tag;
			for (var tf = 1; tf < tagsFound.length; tf++)
				message += ', ' + tagsFound[tf].Category.Name + '#' + tagsFound[tf].Tag;
            message += ']';

            // TODO UI show warning sign next to transaction with tooltip in case of multiple tags found

			console.log(message);
		} else
			transaction.DescriptionHtml = '<div class="' + descriptionTextClass + '">' + transaction.DescriptionHtml + '</div>';

		// remove duplicate/empty tags
		transaction.DescriptionHtml = ReplaceAll(transaction.DescriptionHtml, '<div class="' + descriptionTextClass + '"></div>', '');
	}

	SaveSpendingReport(spendingReport);
	console.log('transactions (' + spendingReport.Id + ') processed');

	return spendingReport;
}

function CategoriesXmlLoaded() {
	ProcessCategories(this.responseXML);
}

function ProcessCategories(categoriesXmlDoc) {

	ParseCategories(categoriesXmlDoc);
	LoadAndTransformXml(categoriesXmlDoc, 'xslt/categories-to-html.xsl', CategoriesChanged);
}

function CategoriesChanged(categoryTagsContent) {

	document.getElementById('categories-content').innerHTML =
		//'<p>Categories:</p>' +
		categoryTagsContent;

	// restore category check state
	var categories = JSON.parse(sessionStorage.getItem('categories'));
	for (var c = 0; c < categories.length; c++) {
		var category = categories[c];
		var checked = JSON.parse(sessionStorage.getItem('categoryCheck' + category.Id));

		if (checked != null)
			CategoryChecked(category.Id, false, checked);
	}

	UpdateSpendingReports();
}

function GetCategories() {

	var categories = JSON.parse(sessionStorage.getItem('categories'));
	return !categories ? [] : categories;
}

function GetActiveCategories() {

	var activeCategories = [];

	var categories = JSON.parse(sessionStorage.getItem('categories'));
	if (!categories || categories.length < 1)
		return activeCategories;

	for (var c = 0; c < categories.length; c++) {
		var category = categories[c];

		if (IsCategoryEnabled(category.Id))
			activeCategories.push(category);
	}

	return activeCategories;
}

function ParseCategories(categoriesXmlDoc) {

	var categoryNodes = categoriesXmlDoc.evaluate('/CategoryTags/Category', categoriesXmlDoc, null, XPathResult.ANY_TYPE, null);
	var categoryNode = categoryNodes.iterateNext();

	var categories = [];
	while (categoryNode) {

		var newCategory = {
			Id: categoryNode.getAttribute('Id'),
			Name: categoryNode.getAttribute('Name'),
			Tags: []
		};

		for (var i = 0; i < categoryNode.childNodes.length; i++) {
			if (categoryNode.childNodes[i].nodeName == 'Tag')
				newCategory.Tags.push(categoryNode.childNodes[i].innerHTML);
		}

		categories.push(newCategory);

		categoryNode = categoryNodes.iterateNext();
	}

	sessionStorage.setItem('categories', JSON.stringify(categories));
	console.log('categories parsed & saved');
}

function GetTransactionsHeaderHtml(id) {

	return '<div id="' + id + '" class="transactions-table content">' +
				'<div class="transactions-header">' +
					'<div class="transactions-row">' +
						'<div class="transactions-header-cell date-cell hilightable center-align" onclick="SortTransactionsAsync(\'' + id + '\', \'transactions-row\', \'transactions-row-cell\', 0, \'date\')">Date</div>' +
						'<div class="transactions-header-cell amount-cell hilightable center-align" onclick="SortTransactionsAsync(\'' + id + '\', \'transactions-row\', \'transactions-row-cell\', 1, \'float\')">Amount</div>' +
						'<div class="transactions-header-cell details-cell hilightable left-align" onclick="SortTransactionsAsync(\'' + id + '\', \'transactions-row\', \'transactions-row-cell\', 2, null)">Details</div >' +
					'</div>' +
				'</div>';
}

function ToggleTransactionDetailsText(show) {

	var allDetails = document.getElementsByClassName('description-text');

	var newValue = null;
	if (show == null) {
		newValue = allDetails[0].style.display == 'none' ? 'inline-block' : 'none';
	} else
		newValue = show ? 'inline-block' : 'none';

	for (var i = 0; i < allDetails.length; i++)
		allDetails[i].style.display = newValue;
}

function GetTransactionHtml(transaction) {

	return '<div class="transactions-row' + (transaction.Amount > 0 ? ' credit-amount' : '') + '">' +
				'<div class="transactions-row-cell date-cell center-align">' + transaction.Date + '</div>' +
				'<div class="transactions-row-cell amount-cell right-align">' + transaction.Amount.toFixed(2) + ' EUR</div>' +
				'<div class="transactions-row-cell details-cell left-align">' +
					(transaction.Category ?
					(
						('<div class="category color' + (transaction.Category ? transaction.Category.Id : '0') + '">' +
							transaction.Category.Name + 
						'</div>')
					) : '') +
					transaction.DescriptionHtml + 
				'</div>' +
			'</div>';
}

function IsCategoryEnabled(id) {

	var checkElement = document.getElementById('categoryCheck' + id);
	return checkElement == null || checkElement.checked;
}

// if checkState is null, works as check toggle
function CategoryChecked(id, updateSpendingReports, checkState) {

	//var checkBoxSpan = document.getElementById('categoryCheckSpan' + id);
	//if (checkBoxSpan.classList.contains('unused'))
	//	checkBoxSpan.classList.remove('unused');
	//else
	//	checkBoxSpan.classList.add('unused');

	// set check state in case the event was not fired by user action
	var categoryCheckInput = document.getElementById('categoryCheck' + id);
	if (checkState != null)
		categoryCheckInput.checked = checkState;

	sessionStorage.setItem('categoryCheck' + id, categoryCheckInput.checked);

	//var category = document.getElementById('category' + id);
	//if (category.classList.contains('unused'))
	//	category.classList.remove('unused');
	//else
	//	category.classList.add('unused');

	var tags = document.getElementById('category' + id + '-tag-list').childNodes;
	for (var t = 0; t < tags.length; t++) {
		var tag = tags[t];
		if (tag.nodeName.toUpperCase() != 'LI')
			continue;

		if (categoryCheckInput.checked)
			tag.classList.remove('unused');
		else
			tag.classList.add('unused');
	}
	
	if (updateSpendingReports)
		UpdateSpendingReportsAsync();
}

function UpdateSpendingReportsAsync() {

	WorkingStart();
	ExecuteAsync(UpdateSpendingReports);
}

function UpdateSpendingReports() {

	document.getElementById('transactions-content').innerHTML = null;
	document.getElementById('transactions-list-content').innerHTML = null;

	UpdateInputFiles();

	var spendingReports = GetActiveSpendingReports();
	if (spendingReports && spendingReports.length > 0) {

		console.log('UpdateSpendingReports-Start: ' + GetCurrentDateTime());

		// update spending reports
		for (var s = 0; s < spendingReports.length; s++)
			ProcessTransactions(spendingReports[s]);

		// print transactions (unfiltered)
		TransactionsFilterChanged('transactions-list-content', 'transactions');

		console.log('UpdateSpendingReports-End: ' + GetCurrentDateTime());

		ShowTransactionsPanel(true);
	}
	else
		ShowTransactionsPanel(false);

	UpdateTagUsage(SettingChecked('showTagUsageCheck'));
	UpdateCategoryUsage(SettingChecked('showCategoryUsageCheck'));

    Draw(null, true);

	WorkingEnd();
}

function ShowTransactionsPanel(show) {

	if (show) {

		var mainContentWidth = sessionStorage.getItem('mainContentWidth');
		if (mainContentWidth == null)
			mainContentWidth = '60%';

		document.getElementById("main-content").style.width = mainContentWidth;
		document.getElementById("splitter").style.display = 'table-cell';
		document.getElementById("right-content").style.display = 'table-cell';

		sessionStorage.setItem('mainContentWidth', mainContentWidth);
	}
	else {

		document.getElementById("main-content").style.width = '100%';
		document.getElementById("splitter").style.display = 'none';
		document.getElementById("right-content").style.display = 'none';
	}
}

function SettingChecked(settingId) {

	var settingElement = document.getElementById(settingId);
	return settingElement && settingElement.checked;
}

function UpdateTagUsage(show) {
	
	var transactions = GetActiveTransactions(null, false);

	var categories = GetCategories();
	for (var c = 0; c < categories.length; c++) {
		var category = categories[c];

		for (var t = 0; t < category.Tags.length; t++) {
			var tag = category.Tags[t];

			var usage = 0;
			if (show) {
				for (var tr = 0; tr < transactions.length; tr++) {
					if (transactions[tr].Description.toUpperCase().indexOf(tag) != -1)
						usage++;
				}
			}

			var tagElement = document.getElementById(category.Id + '-' + tag + '-tag');
			if (tagElement)
				tagElement.innerHTML = tag + (usage > 0 ? ' (' + usage + ')' : ''); 
		}
	}
}

function UpdateCategoryUsage(show) {

	var transactions = GetActiveTransactions(null, false);

	var categories = GetCategories();
	for (var c = 0; c < categories.length; c++) {
		var category = categories[c];

		var usage = 0;
		if (show) {
			for (var t = 0; t < transactions.length; t++) {
				if (transactions[t].Category != null && transactions[t].Category.Id == category.Id)
					usage++;
			}
		}

		var categoryElement = document.getElementById('category' + category.Id);
		if (categoryElement)
			categoryElement.innerHTML = category.Name + (usage > 0 ? ' (' + usage + ')' : '');
	}
}

function UpdateInputFiles() {

	var inputFilesHtml = '';
	var inputFiles = JSON.parse(sessionStorage.getItem('inputFiles'));

	if (inputFiles != null) {
		for (var i = 0; i < inputFiles.length; i++) {

			var spendingReport = JSON.parse(sessionStorage.getItem('spendingReport-' + inputFiles[i].Id));
			if (!spendingReport)
				continue;

			inputFilesHtml +=
				'<li id="' + inputFiles[i].Id + 'Check" class="input-file hilightable' + (!spendingReport.Enabled ? ' unused' : '') + '" onclick="ToggleInputFile(\'' + inputFiles[i].Id + '\')">' +
				inputFiles[i].FileName +
				'</li>';
        }

        ShowId("input-files-content");
    }
    else
        HideId("input-files-content");

	document.getElementById('input-files-content').innerHTML =
		'<ul>' +
			inputFilesHtml +
		'</ul>';
}

function ToggleInputFile(id) {

	var spendingReport = JSON.parse(sessionStorage.getItem('spendingReport-' + id));

	var fileElement = document.getElementById(id + 'Check');
	if (!fileElement.classList.contains('unused')) {

		fileElement.classList.add('unused');
		spendingReport.Enabled = false;

	} else {

		fileElement.classList.remove('unused');
		spendingReport.Enabled = true;
	}

	sessionStorage.setItem('spendingReport-' + id, JSON.stringify(spendingReport));

	UpdateSpendingReportsAsync();
}

function GetMonthSpendingReport(spendingReport) {

	var result = {
		Amounts: [],
		Dates: [],
	};

	// DateTime format: 2018-06-01T00:00:00.0+02:00
	var dayCount = parseInt(spendingReport.DateTimeTo.substring(8, 10));

	for (var d = 1; d <= dayCount; d++) {

		var dayAmount = 0;
		for (var t = 0; t < spendingReport.Transactions.length; t++) {
			var transaction = spendingReport.Transactions[t];

			if (transaction.Category == null || !IsCategoryEnabled(transaction.Category.Id))
				continue;

			if (parseInt(transaction.Date.substring(8, 10)) == d)
				dayAmount += transaction.Amount;
		}

		result.Dates.push(spendingReport.DateTimeTo.substring(0, 8) + (d < 10 ? '0' : '') + d);
		result.Amounts.push(dayAmount);
	}

	return result;
}

function SortTransactionsAsync(tableId, rowClass, columnClass, columnId, compareAs) {
	console.log('SortTransactions(' + tableId + ')-Start: ' + GetCurrentDateTime());
	WorkingStart();

	GetXmlDocumentAsync('.', SortTransactions, tableId, rowClass, columnClass, columnId, compareAs);
}

function SortTransactions(tableId, rowClass, columnClass, columnId, compareAs) {

	SortTable(tableId, rowClass, columnClass, columnId, compareAs);

	WorkingEnd();
	console.log('SortTransactions(' + tableId + ')-End: ' + GetCurrentDateTime());
}

function GetActiveSpendingReports() {

	var spendingReports = [];

	var allSpendingReports = JSON.parse(sessionStorage.getItem('spendingReports'));
	if (allSpendingReports != null) {
		for (var sp = 0; sp < allSpendingReports.length; sp++) {
			var spendingReport = JSON.parse(sessionStorage.getItem('spendingReport-' + allSpendingReports[sp]));
			if (spendingReport.Enabled)
				spendingReports.push(spendingReport);
		}
	}

	return spendingReports;
}

function TransactionsFilterChanged(contentId, id) {

	var filterInput = document.getElementById(id + '-filter-input');
	FilterTransactions(null, contentId, id, null, filterInput ? filterInput.value : null, null);
}

function FilterTransactions(transactions, contentId, id, categoryId, filter, ignoreUnused) {

	// TODO FEATURE filter only transactions from given table (content/id) - not all active

	var transactionsHtml = '';
	var unusedTransactionsHtml = '';

	if (!transactions)
		transactions = GetActiveTransactions(null, true);

	for (var t = transactions.length - 1; t >= 0; t--) {
		var transaction = transactions[t];

		if (filter && transaction.Description.toUpperCase().indexOf(filter.toUpperCase()) < 0)
			continue;

		if (transaction.Category && !IsCategoryEnabled(transaction.Category.Id))
			continue;

		if (categoryId && transaction.Category && transaction.Category.Id != categoryId)
			continue;

		var transactionHtml = GetTransactionHtml(transaction);

		if (!transaction.Category)
			unusedTransactionsHtml += transactionHtml
		else
			transactionsHtml += transactionHtml;
	}

	// uncategorized transactions goes first
	var filteredTransactions = (ignoreUnused == true ? '' : unusedTransactionsHtml) + transactionsHtml;

	if (contentId && id)
		document.getElementById(contentId).innerHTML =
			GetTransactionsHeaderHtml(id) +
				'<div class="transactions-body">' +
					filteredTransactions +
				'</div>' +
			'</div>';

	return filteredTransactions;
}

function GetActiveTransactions(spendingReports, includeUnused) {

	if (spendingReports == null)
		spendingReports = GetActiveSpendingReports();

	var transactions = [];
	for (var s = 0; s < spendingReports.length; s++) {
		var spendingReport = spendingReports[s];

		for (var t = 0; t < spendingReport.Transactions.length; t++) {
			var transaction = spendingReport.Transactions[t];

			if (transaction.Category == null && !includeUnused)
				continue;

			if (transaction.Category && !IsCategoryEnabled(transaction.Category.Id))
				continue;

			transactions.push(transaction);
		}
	}

	return transactions;
}

function DrawAccountTimeline(animate) {

    var animationDuration = 1000;
    if (!animate)
        animationDuration = 0;

    RemoveOldChart('account-sum-content', 'account-sum-canvas');

    var categories = JSON.parse(sessionStorage.getItem('categories'));
    if (categories == null || categories.length == 0)
        return;

    var spendingReports = GetActiveSpendingReports();

    var accountSum = [];
    var transactionDates = [];
    var transactions = GetActiveTransactions(spendingReports, false);

    var balanceStart = 0;
    if (spendingReports.length > 0)
        balanceStart = parseFloat(spendingReports[0].BalanceStart);

    for (var t = 0; t < transactions.length; t++) {
        var transaction = transactions[t];

        if (accountSum.length == 0)
            accountSum.push(transaction.Amount + balanceStart);
        else
            accountSum.push(accountSum[accountSum.length - 1] + transaction.Amount);

        transactionDates.push(transaction.Date);
    }

    var accountSumCanvas = document.getElementById('account-sum-canvas');
    accountSumCanvas.width = accountSumCanvas.style.width;
    accountSumCanvas.height = accountSumCanvas.style.height;
    var accountSumContext = accountSumCanvas.getContext('2d');

    if (accountSum.length > 0) {

        ShowId('account-sum-content');
        var accountSumChart = new Chart(accountSumContext, {
            type: 'line',
            data: {
                labels: transactionDates,
                datasets: [{
                    data: accountSum,
                    backgroundColor: getStyle(document.getElementsByClassName('color0')[0], 'backgroundColor'),
                    borderColor: getStyle(document.getElementsByClassName('color0')[0], 'borderColor'),
                    lineTension: 0,
                    borderWidth: 1,
                    pointRadius: 0
                }]
            },
            options: {
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: animationDuration,
                },
                responsive: true,
                title: {
                    display: true,
                    text: 'Account Balance'
                },
                legend: { display: false },
                tooltips: {
                    enabled: true,
                    mode: 'single',
                    callbacks: {
                        label: function (tooltipItems, data) {

                            var transactionAmount = tooltipItems.yLabel;
                            if (tooltipItems.index > 0)
                                transactionAmount -= data.datasets[0].data[tooltipItems.index - 1];
                            else
                                transactionAmount -= balanceStart;

                            return [' ' + (transactionAmount > 0 ? '+' : '') + transactionAmount.toFixed(2) + ' EUR',
                            ' ' + transactions[tooltipItems.index].Description,
                            ' Balance: ' + tooltipItems.yLabel.toFixed(2) + ' EUR'];
                        }
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function (value, index, values) {
                                return value.toFixed(0) + ' EUR';
                            }
                        }
                    }]
                }
            }
        });
    }
}

function DrawTransactionsTimeline(animate) {

    var animationDuration = 1000;
    if (!animate)
        animationDuration = 0;

    RemoveOldChart('transactions-content', 'transactions-canvas');

    var categories = JSON.parse(sessionStorage.getItem('categories'));
    if (categories == null || categories.length == 0)
        return;

    var borderColors = [];
    var backgroundColors = [];

    var transactionAmounts = [];
    var transactionDates = [];
    var transactions = GetActiveTransactions(null, false);

    for (var t = 0; t < transactions.length; t++) {
        var transaction = transactions[t];

        var categoryColor = GetColor(transaction.Category ? transaction.Category.Id : 0);
        backgroundColors.push(categoryColor.BackgroundColor);
        borderColors.push(categoryColor.BorderColor);

        transactionAmounts.push(transaction.Amount);
        transactionDates.push(transaction.Date);
    }

    var transactionsCanvas = document.getElementById('transactions-canvas');
    transactionsCanvas.width = transactionsCanvas.style.width;
    transactionsCanvas.height = transactionsCanvas.style.height;
    var transactionsContext = transactionsCanvas.getContext('2d');

    if (transactions.length > 0) {

        ShowId('transactions-content');
        var transactionsChart = new Chart(transactionsContext, {
            type: 'bar',
            data: {
                labels: transactionDates,
                datasets: [{
                    data: transactionAmounts,
                    type: 'bar',
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    lineTension: 0,
                    borderWidth: 1,
                    pointRadius: 0
                }]
            },
            options: {
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: animationDuration,
                },
                responsive: true,
                title: {
                    display: true,
                    text: 'Categorized Timeline'
                },
                legend: { display: false },
                tooltips: {
                    enabled: true,
                    mode: 'single',
                    callbacks: {
                        label: function (tooltipItems, data) {
                            var transactionAmount = tooltipItems.yLabel;
                            return [
                                ' ' + (transactionAmount > 0 ? '+' : '') + transactionAmount.toFixed(2) + ' EUR',
                                ' ' + transactions[tooltipItems.index].Description
                            ];
                        }
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function (value, index, values) {
                                return value.toFixed(0) + ' EUR';
                            }
                        }
                    }]
                }
            }
        });
    }
}

function DrawInOut(animate) {

    if (JSON.parse(sessionStorage.getItem('selectedBalance')) != null) {
        DrawBalance(animate);
        return;
    }

	var animationDuration = 1000;
	if (!animate)
		animationDuration = 0;

	RemoveOldChart('spending-report-inout-content', 'spending-report-inout-canvas');

	var categories = JSON.parse(sessionStorage.getItem('categories'));
	if (categories == null || categories.length == 0)
		return;

	var spendingReports = GetActiveSpendingReports();

	var positiveDataSet = {
		label: 'Income',
		data: [],
		backgroundColor: getStyle(document.getElementsByClassName('color-positive')[0], 'backgroundColor'),
		borderColor: getStyle(document.getElementsByClassName('color-positive')[0], 'borderColor'),
		borderWidth: 1,
	};

	var negativeDataSet = {
		label: 'Expenses',
		data: [],
		backgroundColor: getStyle(document.getElementsByClassName('color-negative')[0], 'backgroundColor'),
		borderColor: getStyle(document.getElementsByClassName('color-negative')[0], 'borderColor'),
		borderWidth: 1,
	};

	var positiveSumTotal = 0;
	var negativeSumTotal = 0;

    var details = [];
    var positiveDetail = [];
    var negativeDetail = [];

	var months = [];
	for (var s = 0; s < spendingReports.length; s++) {
		var spendingReport = spendingReports[s];

		var positiveSum = 0, negativeSum = 0;
        var positiveCount = 0, negativeCount = 0;
		for (var t = 0; t < spendingReport.Transactions.length; t++) {
			var transaction = spendingReport.Transactions[t];

			if (transaction.Category == null || !IsCategoryEnabled(transaction.Category.Id))
				continue;

            // TODO FEATURE ignore savings transactions
            if (transaction.Category.Name.toUpperCase() == 'SAVINGS')
                continue;

            // TODO FEATURE count only transactions tagged as INCOME (not all positive ones)
            if (transaction.Category.Name.toUpperCase() == 'INCOME') {
                positiveSum += transaction.Amount;
                positiveCount++;
            }
            else {
                negativeSum += -transaction.Amount;
                negativeCount++;
            }
		}

		// DateTime format: 2018-06-01T00:00:00.0+02:00
		var month = spendingReport.DateTimeTo.substring(0, 7);
		months.push(month)

        positiveDataSet.data.push(positiveSum);
        positiveDetail.push({
            count: positiveCount
        });

		negativeDataSet.data.push(negativeSum);
        negativeDetail.push({
            count: negativeCount
        });

		positiveSumTotal += positiveSum;
		negativeSumTotal += negativeSum;
    }

    details.push(positiveDetail);
    details.push(negativeDetail);

	var inoutCanvas = document.getElementById('spending-report-inout-canvas');
	inoutCanvas.width = inoutCanvas.style.width;
	inoutCanvas.height = inoutCanvas.style.height;
	var inoutContext = inoutCanvas.getContext('2d');

	if (positiveDataSet.data.length > 0) {
		ShowId('spending-report-inout-content');
		var inOutChart = new Chart(inoutContext, {
			type: 'bar',
			data: {
				labels: months,
				datasets: [
					positiveDataSet,
					negativeDataSet
				]
			},
			options: {
				animation: {
					animateScale: true,
					animateRotate: true,
					duration: animationDuration,
				},
				responsive: true,
				title: {
					display: true,
					text: 'Income vs Expenses'
				},
				legend: { display: false },
				tooltips: {
					cornerRadius: 0,
					displayColors: true,
					enabled: true,
					mode: 'single',
					callbacks: {
						title: function (tooltipItems, data) {
							return tooltipItems[0].xLabel + ' ' + data.datasets[tooltipItems[0].datasetIndex].label;
						},
                        label: function (tooltipItems, data) {

                            var messages = [
                                ' ' + tooltipItems.yLabel.toFixed(0) + ' EUR'
                            ];

                            var count = details[tooltipItems.datasetIndex][tooltipItems.index].count;
                            if (count > 1)
                                messages.push(' ' + count + ' transactions ~' + (tooltipItems.yLabel / count).toFixed(0) + ' EUR');

                            return messages;
						}
					}
				},
				scales: {
					yAxes: [{
						ticks: {
							display: true,
							beginAtZero: true,
							callback: function (value, index, values) {
								return value.toFixed(0) + ' EUR';
							}
						}
					}]
                },
                hover: {
                    onHover: function (e) {
                        $("#spending-report-inout-canvas").css("cursor", inOutChart.getElementsAtEvent(e).length > 0 ? "pointer" : "default");
                    }
                }
			}
        });

        inoutCanvas.onclick = function (evt) {

            var activePoints = inOutChart.getElementAtEvent(evt);
            if (activePoints.length > 0) {

                var selectedBalance = {
                    BalanceIndex: activePoints[0]._datasetIndex, // 0=income, 1=expense
                    SpendingReportId: spendingReports[activePoints[0]._index].Id,
                    Title: activePoints[0]._view.label
                };
                sessionStorage.setItem('selectedBalance', JSON.stringify(selectedBalance));

                return Draw('spending-report-inout', true);
            }
        };
	}
}

function DrawBalance(animate) {

    var selectedBalance = JSON.parse(sessionStorage.getItem('selectedBalance'))
    if (selectedBalance == null)
        return;

    var animationDuration = 1000;
    if (!animate)
        animationDuration = 0;

    RemoveOldChart('spending-report-inout-content', 'spending-report-inout-canvas');

    var categories = JSON.parse(sessionStorage.getItem('categories'));
    if (categories == null || categories.length == 0)
        return;

    var sum = 0;
    var borderColors = [];
    var backgroundColors = [];
    var transactionAmounts = [];
    var transactionDates = [];
    var transactionDescriptions = [];

    var spendingReport = JSON.parse(sessionStorage.getItem('spendingReport-' + selectedBalance.SpendingReportId));
    for (var t = 0; t < spendingReport.Transactions.length; t++) {
        var transaction = spendingReport.Transactions[t];

        if (transaction.Category == null || !IsCategoryEnabled(transaction.Category.Id))
            continue;

        // TODO FEATURE ignore savings transactions
        if (transaction.Category.Name.toUpperCase() == 'SAVINGS')
            continue;

        // TODO FEATURE count only transactions tagged as INCOME (not all positive ones)
        if (selectedBalance.BalanceIndex == 0 && transaction.Category.Name.toUpperCase() == "INCOME") {
            sum += transaction.Amount;

            var categoryColor = GetColor(transaction.Category ? transaction.Category.Id : 0);
            backgroundColors.push(categoryColor.BackgroundColor);
            borderColors.push(categoryColor.BorderColor);
            transactionAmounts.push(transaction.Amount);
            transactionDates.push(transaction.Date);
            transactionDescriptions.push(transaction.Description);
        }
        else if (selectedBalance.BalanceIndex == 1 && transaction.Category.Name.toUpperCase() != "INCOME") {
            sum += transaction.Amount;

            var categoryColor = GetColor(transaction.Category ? transaction.Category.Id : 0);
            backgroundColors.push(categoryColor.BackgroundColor);
            borderColors.push(categoryColor.BorderColor);
            transactionAmounts.push(transaction.Amount);
            transactionDates.push(transaction.Date);
            transactionDescriptions.push(transaction.Description);
        }
    }

    var inoutCanvas = document.getElementById('spending-report-inout-canvas');
    inoutCanvas.width = inoutCanvas.style.width;
    inoutCanvas.height = inoutCanvas.style.height;
    var inoutContext = inoutCanvas.getContext('2d');

    if (transactionAmounts && transactionAmounts.length > 0) {

        ShowId('spending-report-inout-content');
        var transactionsChart = new Chart(inoutContext, {
            type: 'bar',
            data: {
                labels: transactionDates,
                datasets: [{
                    data: transactionAmounts,
                    type: 'bar',
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    lineTension: 0,
                    borderWidth: 1,
                    pointRadius: 0
                }]
            },
            options: {
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: animationDuration,
                },
                responsive: true,
                title: {
                    display: true,
                    text: (selectedBalance.BalanceIndex == 0 ? 'Income' : 'Expenses') + ' in ' + selectedBalance.Title
                },
                legend: { display: false },
                tooltips: {
                    enabled: true,
                    mode: 'single',
                    callbacks: {
                        label: function (tooltipItems, data) {
                            var transactionAmount = tooltipItems.yLabel;
                            return [
                                ' ' + (transactionAmount > 0 ? '+' : '') + transactionAmount.toFixed(2) + ' EUR',
                                ' ' + transactionDescriptions[tooltipItems.index]
                            ];
                        }
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function (value, index, values) {
                                return value.toFixed(0) + ' EUR';
                            }
                        }
                    }]
                },
                hover: {
                    onHover: function (e) {
                        $("#spending-report-inout-canvas").css("cursor", "pointer");
                    }
                }
            }
        });

        inoutCanvas.onclick = function (evt) {

            sessionStorage.setItem('selectedBalance', null);
            return Draw('spending-report-inout', true);
        };
    }
}

function DrawAllCategories(animate) {

    if (JSON.parse(sessionStorage.getItem('selectedCategory')) != null) {
        DrawCategory(animate);
        return;
    }

    var animationDuration = 1000;
    if (!animate)
        animationDuration = 0;

    RemoveOldChart('spending-report-all-content', 'spending-report-all-canvas');

    var categories = JSON.parse(sessionStorage.getItem('categories'));
    if (categories == null || categories.length == 0)
        return;

    var spendingReports = GetActiveSpendingReports();

    var colors = GetColors(categories);

    var allCanvas = document.getElementById('spending-report-all-canvas');
    allCanvas.width = allCanvas.style.width;
    allCanvas.height = allCanvas.style.height;
    var allContext = allCanvas.getContext('2d');

    var categoryNames = [];
    if (spendingReports.length > 0 && categories != null) {
        for (var c = 0; c < categories.length; c++) {
            var category = categories[c];

            if (!IsCategoryEnabled(category.Id))
                continue;

            categoryNames.push(category.Name);
        }
    }

    var dataSets = [];
    var details = [];
    for (var s = 0; s < spendingReports.length; s++) {
        var spendingReport = spendingReports[s];

        var dataSet = {
            data: [],
            backgroundColor: colors.BackgroundColors,
            borderColor: colors.BorderColors,
            borderWidth: 1,
            label: spendingReport.DateTimeFrom.substring(0, 7)
        };
        var detail = [];

        if (categories != null) {
            for (var c = 0; c < categories.length; c++) {
                var category = categories[c];

                if (!IsCategoryEnabled(category.Id))
                    continue;

                var sumCountObj = CategoryAmountSum(spendingReport, category);
                dataSet.data.push(sumCountObj.Sum < 0 ? -sumCountObj.Sum : sumCountObj.Sum);
                detail.push({ count: sumCountObj.Count });
            }
        }
        else {
            var sumCountObj = CategoryAmountSum(spendingReport, null)
            dataSet.data.push(sumCountObj.Sum < 0 ? -sumCountObj.Sum : sumCountObj.Sum);
            detail.push({ count: sumCountObj.Count });
        }
        
        dataSets.push(dataSet);
        details.push(detail);
    }

    if (dataSets.length > 0) {
        ShowId('spending-report-all-content');
        var allChart = new Chart(allContext, {
            type: 'bar',
            data: {
                labels: categoryNames,
                datasets: dataSets
            },
            options: {
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: animationDuration,
                },
                responsive: true,
                title: {
                    display: true,
                    text: 'Categorized'
                },
                legend: { display: false },
                tooltips: {
                    cornerRadius: 0,
                    displayColors: true,
                    enabled: true,
                    mode: 'single',
                    callbacks: {
                        title: function (tooltipItems, data) {
                            return tooltipItems[0].xLabel + ' ' + data.datasets[tooltipItems[0].datasetIndex].label;
                        },
                        label: function (tooltipItems, data) {
                            var messages = [
                                ' ' + tooltipItems.yLabel.toFixed(0) + ' EUR'
                            ];

                            var count = details[tooltipItems.datasetIndex][tooltipItems.index].count;
                            if (count > 1)
                                messages.push(' ' + count + ' transactions ~' + (tooltipItems.yLabel / count).toFixed(0) + ' EUR');

                            return messages;
                        }
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            display: true,
                            beginAtZero: true,
                            callback: function (value, index, values) {
                            	return value.toFixed(0) + ' EUR';
                            }
                        }
                    }]
                },
                hover: {
                    onHover: function (e) {
                        $("#spending-report-all-canvas").css("cursor", allChart.getElementsAtEvent(e).length > 0 ? "pointer" : "default");
                    }
                }
            }
        });

        allCanvas.onclick = function (evt) {
            var activePoints = allChart.getElementAtEvent(evt);

            if (activePoints.length > 0 && categories != null) {

                var categoryName = activePoints[0]._view.label;
                for (var c = 0; c < categories.length; c++) {
                    var category = categories[c];
                    if (category.Name == categoryName) {

                        var yearAndMonth = activePoints[0]._view.datasetLabel;
                        var spendingReports = JSON.parse(sessionStorage.getItem('spendingReports'));
                        for (var s = 0; s < spendingReports.length; s++) {
                            var spendingReportId = spendingReports[s];

                            if (spendingReportId.indexOf(yearAndMonth) > -1)
                            {
                                var selectedCategory = {
                                    category: category,
                                    spendingReportId: spendingReportId
                                };
                                sessionStorage.setItem('selectedCategory', JSON.stringify(selectedCategory));

                                return Draw('spending-report-all', true);
                            }
                        }
                        break;
                    }
                }
            }
        };
    }
}

function DrawCategory(animate) {

    var selectedCategory = JSON.parse(sessionStorage.getItem('selectedCategory'))
    if (selectedCategory == null)
        return;

    var animationDuration = 1000;
    if (!animate)
        animationDuration = 0;

    RemoveOldChart('spending-report-all-content', 'spending-report-all-canvas');

    var categories = JSON.parse(sessionStorage.getItem('categories'));
    if (categories == null || categories.length == 0)
        return;

    var spendingReports = GetActiveSpendingReports();

    var selectedSpendingReport = null;
    if (selectedCategory.spendingReportId && spendingReports.some(sp => sp.Id == selectedCategory.spendingReportId)) {
        selectedSpendingReport = JSON.parse(sessionStorage.getItem('spendingReport-' + selectedCategory.spendingReportId));

    } else
        return;
    
    var month = selectedSpendingReport != null ? selectedSpendingReport.DateTimeTo.substring(0, 7) : null;

    var selectedSpendingReportDates = [];
    var selectedSpendingReportAmounts = [];
    var selectedSpendingTransactions = [];

    if ((selectedCategory.category && IsCategoryEnabled(selectedCategory.category.Id)) || selectedSpendingReport) {

        ShowId('transactions-list-content');

        var transactionsHtml = '';
        for (var s = spendingReports.length - 1; s >= 0; s--) {
            var spendingReport = spendingReports[s];

            if (selectedSpendingReport && spendingReport.Id != selectedCategory.spendingReportId)
                continue;

            transactionsHtml += FilterTransactions(spendingReport.Transactions, null, null, selectedCategory.category.Id, null, true);

            for (var t = spendingReport.Transactions.length - 1; t >= 0; t--) {
                var transaction = spendingReport.Transactions[t];

                if (!transaction.Category || (transaction.Category && transaction.Category.Id != selectedCategory.category.Id))
                    continue;

                selectedSpendingReportAmounts.push(transaction.Amount);
                selectedSpendingReportDates.push(transaction.Date);
                selectedSpendingTransactions.push(transaction);
            }
        }

        // order transactions in chart from past to current time
        selectedSpendingReportAmounts.reverse();
        selectedSpendingReportDates.reverse();
        selectedSpendingTransactions.reverse();

        document.getElementById('transactions-list-content').innerHTML =
            GetTransactionsHeaderHtml('transactions') +
            '<div class="transactions-body">' +
            transactionsHtml +
            '</div>' +
            '</div>';
    }
    else
        return;

    var categoryMonthCanvas = document.getElementById('spending-report-all-canvas');
    categoryMonthCanvas.width = categoryMonthCanvas.style.width;
    categoryMonthCanvas.height = categoryMonthCanvas.style.height;
    var categoryMonthContext = categoryMonthCanvas.getContext('2d');

    if (selectedSpendingTransactions && selectedSpendingTransactions.length > 0) {

        var categoryColor = GetColor(selectedCategory.category.Id);
        var selectedSpendingReportBackgroundColor = categoryColor.BackgroundColor;
        var selectedSpendingReportBorderColor = categoryColor.BorderColor;

        //var xAxisPosition = (selectedSpendingReportAmounts.filter(a => a > 0).length > selectedSpendingReportAmounts.length / 2) ? 'bottom' : 'top';
        var xAxisPosition = 'bottom';

        ShowId('spending-report-all-content');
        var categoryMonthChart = new Chart(categoryMonthContext, {
            type: 'bar',
            data: {
                labels: selectedSpendingReportDates,
                datasets: [{
                    data: selectedSpendingReportAmounts,
                    type: 'bar',
                    backgroundColor: selectedSpendingReportBackgroundColor,
                    borderColor: selectedSpendingReportBorderColor,
                    lineTension: 0,
                    borderWidth: 1,
                    pointRadius: 0
                }]
            },
            options: {
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: animationDuration,
                },
                responsive: true,
                title: {
                    display: true,
                    text: selectedCategory.category.Name.toUpperCase() + (month ? ' in ' + month : ''),
                },
                legend: { display: false },
                tooltips: {
                    enabled: true,
                    mode: 'single',
                    callbacks: {
                        title: function (tooltipItems, data) {
                            return tooltipItems[0].xLabel;
                        },
                        label: function (tooltipItems, data) {
                            var transactionAmount = tooltipItems.yLabel;
                            return [
                                ' ' + transactionAmount.toFixed(2) + ' EUR',
                                ' ' + selectedSpendingTransactions[tooltipItems.index].Description
                            ];
                        }
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            callback: function (value, index, values) {
                                return value.toFixed(0) + ' EUR';
                            }
                        }
                    }],
                    xAxes: [{
                        position: xAxisPosition
                    }],
                },
                hover: {
                    onHover: function (e) {
                        $("#spending-report-all-canvas").css("cursor", "pointer");
                    }
                }
            }
        });

        categoryMonthCanvas.onclick = function (evt) {

            sessionStorage.setItem('selectedCategory', null);
            return Draw('spending-report-all', true);
        };
    }
}

function Draw(chartId, animate) {

	console.log('Draw-Start ' + GetCurrentDateTime());

	var currentTab = sessionStorage.getItem('currentTab');
	console.log('currentTab: ' + currentTab);

    if (currentTab == 'spending-reports-tab') {

        if (chartId == null) {

            DrawAccountTimeline(animate);
            DrawTransactionsTimeline(animate);
            DrawInOut(animate);
            DrawAllCategories(animate);
        }
        else {

            if (chartId == 'account-sum')
                DrawAccountTimeline(animate);
            else if (chartId == 'transactions')
                DrawTransactionsTimeline(animate);
            else if (chartId == 'spending-report-inout')
                DrawInOut(animate);
            else if (chartId == 'spending-report-all')
                DrawAllCategories(animate);
        }
    }
    else {

    	RemoveOldChart('account-sum-content', 'account-sum-canvas');
	    RemoveOldChart('transactions-content', 'transactions-canvas');
        RemoveOldChart('spending-report-inout-content', 'spending-report-inout-canvas');
	    RemoveOldChart('spending-report-all-content', 'spending-report-all-canvas');
    }
	
	console.log('Draw-End ' + GetCurrentDateTime());
	WorkingEnd();
}

function RemoveOldChart(id, canvasId) {
	document.getElementById(id).innerHTML = '<canvas id="' + canvasId + '"></canvas>';
	HideId(id);
}

function GetColor(id) {
	return {
		BackgroundColor: getStyle(document.getElementsByClassName('color' + id)[0], 'backgroundColor'),
		BorderColor: getStyle(document.getElementsByClassName('color' + id)[0], 'borderColor')
	};
}

function GetColors(categories) {

	if (categories == null)
		categories = JSON.parse(sessionStorage.getItem('categories'));

	var result = {
		BackgroundColors: [],
		BorderColors: []
	};

	if (categories != null) {
		for (var c = 0; c < categories.length; c++) {
			var category = categories[c];

			if (!IsCategoryEnabled(category.Id))
				continue;

			result.BackgroundColors.push(getStyle(document.getElementsByClassName('color' + category.Id)[0], 'backgroundColor'));
			result.BorderColors.push(getStyle(document.getElementsByClassName('color' + category.Id)[0], 'borderColor'));
		}
	}

	return result;
}

function AddCategory() {

	var newCategoryName = prompt('Add new category:', '');
	if (newCategoryName == null || newCategoryName == '')
		return;

	var categories = JSON.parse(sessionStorage.getItem('categories'));
	
	if (categories == null)
		categories = [];

	var nextId = 0;
	var idUsed = true;
	while (idUsed) {
		nextId++;
		idUsed = categories.some(c => c.Id == nextId);
	}

	var newCategory = {
		Name: newCategoryName,
		Id: nextId
	};

	if (categories.some(c => c.Name == newCategoryName))
		return;

	categories.push(newCategory);
	console.log('category (' + newCategoryName + ') added');

	UpdateCategories(categories);
}

function RemoveCategory(categoryToRemove) {
	
	if (!confirm('Remove category ' + categoryToRemove + ' ?'))
		return;

	var categories = JSON.parse(sessionStorage.getItem('categories'));
	for (var c = 0; c < categories.length; c++) {

		if (categories[c].Name == categoryToRemove) {

			categories.splice(c, 1);
			console.log('category (' + categoryToRemove + ') removed');

			UpdateCategories(categories);
			return;
		}
	}
}

function AddTag(category) {

	var newTag = prompt('Add new tag to ' + category + ':', '');
	if (newTag == null || newTag == '')
		return;	

	var categories = JSON.parse(sessionStorage.getItem('categories'));

	// kontrola ci je podobny alebo zhodny tag uz pouzity
	for (var c = 0; c < categories.length; c++) {

		if (categories[c].Tags.includes(newTag)) {
			console.log('tag (' + newTag + ') is already used');
			return;
		}

		// kontrola na podobne tagy, ak ide o rovnaku kategoriu, tak to povolim
		if (categories[c].Name == category)
			continue;

		// kontrola na podobny tag
		for (var t = 0; t < categories[c].Tags.length; t++)
			if (categories[c].Tags[t].indexOf(newTag) > -1 || newTag.indexOf(categories[c].Tags[t]) > -1) {
				console.log('tag similar to (' + newTag + ') is already used');
				return;
			}
	}

	for (var c = 0; c < categories.length; c++) {

		if (categories[c].Name == category) {
			if (!categories[c].Tags.includes(newTag)) {

				newTag = newTag.toUpperCase();
				categories[c].Tags.push(newTag);
				console.log('tag (' + newTag + ') added to category (' + category + ')');

				UpdateCategories(categories);
			}
			return;
		}
	}
}

function RemoveTag(tagToRemove) {

	if (!confirm('Remove tag ' + tagToRemove + ' ?'))
		return;

	var categories = JSON.parse(sessionStorage.getItem('categories'));
	for (var c = 0; c < categories.length; c++) {

		var category = categories[c];
		for (var t = 0; t < category.Tags.length; t++) {

			var tag = category.Tags[t];
			if (tag == tagToRemove) {
				
				category.Tags.splice(t, 1);
				console.log('tag (' + tagToRemove + ') removed from category (' + category.Name + ')');

				UpdateCategories(categories);
				return;
			}
		}
	}
}

function UpdateCategories(newCategories) {

	var categories = newCategories;
	if (categories == null)
		categories = JSON.parse(sessionStorage.getItem('categories'));

	WorkingStart();

	ProcessCategories(CreateCategoriesXml(categories));
}

function SaveCategories() {

	var categories = JSON.parse(sessionStorage.getItem('categories'));
	var categoriesXmlDoc = CreateCategoriesXml(categories);

	Download('categories.xml', new XMLSerializer().serializeToString(categoriesXmlDoc.documentElement));
}

function CreateCategoriesXml(categories) {

	var xmlDoc = document.implementation.createDocument(null, "CategoryTags");

	if (categories != null) {
		for (var c = 0; c < categories.length; c++) {
			var category = categories[c];

			var newCategory = xmlDoc.createElement('Category');
			newCategory.setAttribute('Name', category.Name);
			newCategory.setAttribute('Id', category.Id);

			if (category.Tags != null) {
				for (var t = 0; t < category.Tags.length; t++) {

					var newTag = xmlDoc.createElement('Tag');
					var newTagValue = xmlDoc.createTextNode('test');
					newTagValue.nodeValue = category.Tags[t];

					newTag.appendChild(newTagValue);
					newCategory.appendChild(newTag);
				}
			}

			xmlDoc.getElementsByTagName('CategoryTags')[0].appendChild(newCategory);
		}
	}

	return xmlDoc;
}

function WorkingStart() {
	console.log('working ...');
	Show(workInProgressOverlay);
	Show(workInProgress);
}

function WorkingEnd() {
	Hide(workInProgress);
	Hide(workInProgressOverlay);
	console.log('... ready');
}


function ListTransactions(ignoreUncategorized = true) {

    // foreach enabled input file and each transaction
    // skip if (category == null && ignoreUncategorized) || category is disabled
    // skip if transaction filter does not match

    return [{

        StartAmount: 0,
        Amounts: [],
        BorderColors: [],
        BackgroundColors: [],

        // ...
    }];
}

// mode 0=month, 1=quarterly, 2=semiannually, 3=annually, 4=total
function GroupTransactions(mode = 0) {


}