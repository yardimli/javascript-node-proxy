$(document).ready(function() {

	var checkforimages = false;
	var isworking = false;
	var postData = {
		"urltoget": "http://www.fish.com/",
		"job" : "startscreenshots"
	}
	var jobid = "0000";
	var loadpermalink = false;

	//---------------------------------------------------------------------------------------------------------------------------------------
	if (typeof String.prototype.startsWith != 'function') {
		// see below for better implementation!
		String.prototype.startsWith = function(str) {
			return this.indexOf(str) === 0;
		};
	}


	//---------------------------------------------------------------------------------------------------------------------------------------
	function escapeHTML(text) {
		return text.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g,
			'&gt;');
	}

	//---------------------------------------------------------------------------------------------------------------------------------------
	function bytesToSize(bytes) {
		var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes == 0) return '0 Bytes';
		var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
	}

	function ValidURL(str) {
	  var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
	  if(!regex .test(str)) {
	    return false;
	  } else {
	    return true;
	  }
	}

	function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	$("#preview-area").hide();

	$("#statusbar").hide();

	$("#errormsg").hide();

	if (getParameterByName('jobid')!="") {
		checkforimages = false;
		isworking = false;
		loadpermalink = true;

		$("#ie8place").attr('src',"loader1.gif");
		$("#ie9place").attr('src',"loader1.gif");
		$("#ie10place").attr('src',"loader1.gif");
		$("#ie11place").attr('src',"loader1.gif");
		$("#firefoxplace").attr('src',"loader1.gif");
		$("#chromeplace").attr('src',"loader1.gif");

		$("#preview-area").fadeIn();
		//$("#statusbar").fadeIn();

		var valeur = 0;
		$('#download-progress').css('width', valeur+'%').attr('aria-valuenow', valeur);

		$("#errormsg").hide();

		checkforimages = true;
		jobid = getParameterByName('jobid');
	}


	$("#CaptureURL").on('click',function() {
		if ( ValidURL($("#inputUrl").val() ) )
		{
			checkforimages = false;
			isworking = false;
			loadpermalink = false;


			$('#download-progress-box').addClass("active");

			$("#ie8_thumb").attr('src',"loader1.gif");
			$("#ie9_thumb").attr('src',"loader1.gif");
			$("#ie10_thumb").attr('src',"loader1.gif");
			$("#ie11_thumb").attr('src',"loader1.gif");
			$("#firefox_thumb").attr('src',"loader1.gif");
			$("#chrome_thumb").attr('src',"loader1.gif");

			$("#preview-area").fadeIn();
			$("#statusbar").fadeIn();

			var valeur = 0;
			$('#download-progress').css('width', valeur+'%').attr('aria-valuenow', valeur);

			$("#errormsg").hide();

			var postData = {
				"urltoget": $("#inputUrl").val(),
				"screensize": $("#screensizebox").val(),
				"job" : "startscreenshots"
			}

			$.ajax({
				type: "POST",
				url: "getscreen.php",
				dataType: 'JSON',
				data: postData,
				success: function(data) {
					console.log(data["requestid"]);
					console.log(data["requesturl"]);
					console.log(data["postresult"]);
					checkforimages = true;
					jobid = data["requestid"];

					$("#permalinktxt").val(data["permalink"]);

				},
				error: function(e) {
					console.log(e.message);
				}
			});


		} else {
			$("#errormsg").fadeIn();
		}
	});



	var refreshIntervalId = setInterval(function() {
		if ((checkforimages) && (!isworking)) {
			isworking = true;

			var postData = {
				"jobid": jobid,
				"job" : "queryscreenshots"
			};

			$.ajax({
				type: "POST",
				url: "getscreen.php",
				dataType: 'JSON',
				data: postData,
				success: function(data) {
					console.log(data);
					var allgood =0;
					var allbad =0;

					if (loadpermalink) {
						$("#inputUrl").val( data[0]["urltoget"] );
					}

					$.each(data, function(index,item) {
						if (data[index]["result"]=="good") {
							$("#"+data[index]["browser"]+"_thumb").attr('src',"screens/"+data[index]["imagefile"]);
							$("#"+data[index]["browser"]+"_link").attr('href',"screens/"+data[index]["imagefile"]);
							allgood++;
						} else
						if (data[index]["result"]=="error") {
							$("#"+data[index]["browser"]+"_thumb").attr('src',"404.gif");
							$("#"+data[index]["browser"]+"_link").attr('href',"404.gif");
							allbad++;
						}
					});

					var valeur = Math.round( ((allgood+0.1)/6.1)*100 );
					$('#download-progress').css('width', valeur+'%').attr('aria-valuenow', valeur);

					isworking = false;

					if ( (allgood+allbad)==6) {
						 console.log("done");
						 //clearInterval(refreshIntervalId);
						 $('#download-progress-box').removeClass("active");
						 checkforimages = false;
					 }
				},
				error: function(e) {
					console.log(e.statusText+" "+e.status);
					isworking = false;
				}
			});

		}
	}, 1000);

});
