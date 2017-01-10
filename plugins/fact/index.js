var request = require('sync-request');
var parser = require('xml2json');


String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function get_wlfra_result(query) {
	var url = 'http://api.wolframalpha.com/v2/query?input=<query>&appid=U7L4VR-K3WJPLK6Y2';

	var data = request('GET', url.replace('<query>',query));

	data = JSON.parse(parser.toJson(data.getBody()));

	var pods = data.queryresult.pod;

	var result = "";

	try {
		for (var i = 0; i < pods.length; i++){
			var index = pods[i];

			if (index.primary === 'true') {
          		result = index.subpod.plaintext;
          		break;
	        }

			if (index.id == "Result"){
				result = index.subpod.plaintext;
				break;
			}
		}

		if (result == ""){
			for (var i = 0; i < pods.length; i++){
				var index = pods[i];

				if (index.title == "Basic information"){
					result = index.subpod.plaintext;
					break;
				}
			}
		}

		// if (result.indexOf('1 | ') == 0) {

	 //        var idx = 1;
	 //        var defns = result.split(/\n/);

	 //        var len  = (defns.length > 3) ? 3 : defns.length,
	 //            result = '';

	 //        for (var i = 0; i < len; i++) {
	 //          result += defns[i].replace(/^(.*)\|(.*)\|/, '') + '.';
	 //        }

  //     	}

      	if (result.indexOf('|') != -1){
      		result = result.replaceAll(' |', ', ');
      	}

		return result;
	} catch (e){
		console.log(e);
		return "";
	}


}


function get_ddg_result(query) {
	var ddg_url = 'http://api.duckduckgo.com/?q=<query>&format=json&pretty=1';

	var data = request('GET',ddg_url.replace('<query>', query));

	data = JSON.parse(data.getBody());

	var resp = data.AbstractText;

	if (resp.split('.')[1] && resp.split('.')[1] != ""){
		return resp.split('.')[0];
	} else {
		return resp;
	}
}


function * fact_resp(query){
	var fact = get_ddg_result(query);

	if (!fact || fact == ""){
		fact = get_wlfra_result(query);
	}
	
	return fact;
}

module.exports = {
	get: fact_resp
}