function LoadAndTransformXml(xml, xslt, callback) {

	if (window.ActiveXObject || "ActiveXObject" in window) {
		// IE11

		var xslt = LoadXSLTDocumentInIE(xslt);

		// Load the XML Document
		var xmlDoc = new ActiveXObject("Msxml2.DOMDocument.3.0");
		xmlDoc.async = false;
		xmlDoc.resolveExternals = false;
		xmlDoc.loadXML((new XMLSerializer()).serializeToString(xml));

		console.log(xmlDoc.parseError.reason); // for debugging, to make sure there is no errors after loading the document.

		// Load the XSL file
		var xsltProcessor = new ActiveXObject("Msxml2.XSLTemplate");
		var xslDoc = new ActiveXObject("Msxml2.FreeThreadedDOMDocument");
		xslDoc.async = false;
		xslDoc.loadXML(xslt.responseText);
		xsltProcessor.stylesheet = xslDoc;

		var xslProc = xsltProcessor.createProcessor();
		xslProc.input = xmlDoc;
		xslProc.transform();

		if (callback != null)
			callback(xslProc.output.documentElement.outerHTML);
	}
	else {
		// Chrome, ...
		GetXmlDocumentAsync(xslt, XsltLoaded, xml, callback);
	}
}

function XsltLoaded(xml, callback) {

	var xslt = this.responseXML;

	var xsltProcessor = new XSLTProcessor();
	xsltProcessor.importStylesheet(xslt);

	var resultDocument = xsltProcessor.transformToDocument(xml);

	if (callback != null)
		callback(resultDocument.documentElement.outerHTML);
}

function XMLHttpRequestSuccess() { this.callback.apply(this, this.arguments); }

function XMLHttpRequestError() { console.error(this.statusText); }

function GetXmlDocumentAsync(url, callback) {

	var xhr = new XMLHttpRequest();
	xhr.callback = callback;
	xhr.arguments = Array.prototype.slice.call(arguments, 2);
	xhr.onload = XMLHttpRequestSuccess;
	xhr.onerror = XMLHttpRequestError;

	xhr.open("GET", url, true);
	xhr.send(null);
}

function LoadXSLTDocumentInIE(fileName) {
	xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	try {
		xhttp.responseType = "msxml-document";
	} catch (e) {
		//console.log(“couldn’t set the response type msxml in IE”);
	}
	xhttp.open("GET", fileName, false);
	xhttp.send("");
	return xhttp;
}

function ExecuteAsync(callback) {

	// asynchronne volanie, zatil len ako ojeb cez callback GET operacie
	GetXmlDocumentAsync('', callback);
}