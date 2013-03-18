/**
 * Function that convert an xml to json
 * @author http://davidwalsh.name/convert-xml-json
 * @param {string} xml an xml object string
 * @return {string} obj a json dictionary
 * @fileoverview Simple function to convert xml to json
 */
function xmlToJson(xml) {
  // Create the return object
  var obj = {};
  if (xml.nodeType == 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
    }
  } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
  }
  // do children
  if (xml.hasChildNodes()) {
    for(var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) == "undefined") {
            obj[nodeName] = xmlToJson(item);
        } else {
            if (typeof(obj[nodeName].push) == "undefined") {
                var old = obj[nodeName];
                obj[nodeName] = [];
                obj[nodeName].push(old);
            }
            obj[nodeName].push(xmlToJson(item));
        }
    }
  }
  return obj;
};
/**
 * Function to call to write soap messages on console
 * @param {String} title 
 * @return {String} messageXML : can be a string or an xml object
 */
function messageLog(title,messageXML) {
	var xml = $.parseXML(messageXML);
	if (xml == null) {
		var message = JSON.stringify(xmlToJson(messageXML),null,"  ");
		console.log(title+" = "+message);
	}
	else{
		var message = JSON.stringify(xmlToJson(xml),null,"  ");
		console.log(title+" = "+message);
	}
}
/**
 * @author Gabriele Di Bari
 * @author Mirco Tracolli
 * @fileoverview JQUERY is required
 */
/**
 * site web url
 * defaultUrl : according do app.py __soap_server_address__
 */
var defaultUrl = window.location.protocol+"//"+window.location.host+"/soap";
/**
 * Class that contain Soap functions
 * @param {string} urlSoapServer the url of the soap web server
 * @constructor
 */
function SoapApi(urlSoapServer) {
    /**
     * Constructor for a singleton
     */
    if ( SoapApi.prototype._singletonInstance ){
        if(!(typeof urlSoapServer === 'undefined' || urlSoapServer==null))
            this.SOAPSERVER = urlSoapServer;
        return SoapApi.prototype._singletonInstance;
    }
    /**
     * first call save object in singleton istance
     */
      SoapApi.prototype._singletonInstance = new objectSoapApi(urlSoapServer);
      return SoapApi.prototype._singletonInstance;
    /**
     * An object that can manage soap
     * @param {string} urlSoapServer the url of the soap web server
     */
    function objectSoapApi(urlSoapServer){
        /**
         * if is not def set default url
         */
        if(!(typeof urlSoapServer === 'undefined' || urlSoapServer==null))
            this.SOAPSERVER = urlSoapServer;
        else
            this.SOAPSERVER = defaultUrl
        /**
         * Some constant variables with parameters that will be replaced
         * @constant
         * @type String
         */
        this.METHODE = "<ns:METHOD xmlns:ns=\"NAMESPACE\">";
        this.METHODECLOSE = "</ns:METHOD>";
        this.ARGE = "<NAME xsi:type='xsd:TYPE'>VALUE</NAME>";
		/**
		 * Variable that will contain results
         * @type {Dict}
         */
		this.result = {};
        
        this.createSoapMessage = function (namespace, method, args) {
            /**
			 * Function to create a soap message
             * @param {String} namespace
             * @param {String} method
             * @param {Dict} args { varName : [elementType,elementValue] }
             * @returns {Dict} { message : soapMessage, tagResponse : String , tagResult : String, ns : String}
            */
            var soapMessage = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
            soapMessage += "<SOAP-ENV:Envelope";
            soapMessage += " xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\"";
            soapMessage += " SOAP-ENV:encodindStyle=\"http://schemas.xmlsoap.org/soap/encoding/\""; 
            soapMessage += " xmlns:SOAP-ENC=\"http://schemas.xmlsoap.org/soap/encoding/\""; 
            soapMessage += " xmlns:xsi=\"http://www.w3.org/1999/XMLSchema-instance\"";
            soapMessage += ">";
            soapMessage += "<SOAP-ENV:Body>";
            soapMessage += this.METHODE.replace("NAMESPACE",namespace).replace("METHOD",method);
            if (args != null && !(args instanceof Array)) {
                for (var k in args) {
                    soapMessage += this.ARGE.replace(/\bNAME\b/gi,k).replace("TYPE",args[k][0]).replace("VALUE",args[k][1]);
                }
            }
            soapMessage += this.METHODECLOSE.replace("METHOD",method);
            soapMessage += "</SOAP-ENV:Body>"; 
            soapMessage += "</SOAP-ENV:Envelope>";
			// Log message
			messageLog("Sent message", soapMessage);
            return {"message" : soapMessage, "tagResponse" : String(method+"Response"), "tagResult" : String(method+"Result"),"ns" : namespace};
        };
		
		this.getNamespaceTag = function (parsedData,namespace){
			/**
			 * Function to extract namespace tag from a general xml soap response
             * @param {Dict} parsedData
             * @param {String} namespace
             * @returns {String}
            */
			var ns = "";
			for (key in parsedData["senv:Envelope"]["@attributes"]){
				if (parsedData["senv:Envelope"]["@attributes"][key] == namespace){
					ns = key.split(":")[1];
				}
			}
			return ns;
		};
		
		this.readMessage = function (message){
			/**
			 * Function that return the results
             * @param {Dict} message
             * @returns {Dict}
            */
			var ns = this.getNamespaceTag(message["data"],message["ns"]);
			return message["data"]["senv:Envelope"]["senv:Body"][String(ns+":"+message["tagResponse"])][String(ns+":"+message["tagResult"])];
		};
		
        this.sendMessage = function (message,callback){
			/**
			 * Function to send message to soap server
             * @param {Dict} message
             * @returns {Dict} { data : parsedData, tagResponse : String , tagResult : String, ns : String}
            */
			var dataToRead = null;
            $.post(this.SOAPSERVER, message["message"],
                function(data, textStatus, jqXHR) {/* succes */},"xml"
            ).fail(function(data){
                alert("Fail!");
            }).done(function(data){
				var soap = SoapApi();
                var parsedData = xmlToJson(data);
				var result = null;
				// Log message
                messageLog("Received message", data);
				result = soap.readMessage({"data" : parsedData, "tagResponse" : message["tagResponse"],"tagResult" : message["tagResult"],"ns" : message["ns"]});
				callback(result);
            }).error(function(XMLHttpRequest, textStatus, errorThrown) { 
                alert("There are some errors: " + textStatus + "\n -> " + errorThrown);				
            });
        }
    }  
}
