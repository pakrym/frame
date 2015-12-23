PhotoClock = {

	start: function()
	{
		var self = this;
		self.$photo = $("#photo");
		self.$hours = $("#hours");
		self.$minutes = $("#minutes");
		self.$seconds = $("#seconds");
		self.instagramRegex = RegExp("access_token=([\\w\\d\\.]+)");

		self.id = 0;
		self.photos = [];
		self.instagramToken = localStorage.getItem("instagramToken");
		if (self.instagramRegex.test(window.location.href))
		{
			self.instagramToken = self.instagramRegex.exec(window.location.href)[1];
			localStorage.setItem("instagramToken", self.instagramToken);
		}
		console.log(self.instagramToken);
		if (!self.instagramToken)
		{	
			window.location.replace("https://instagram.com/oauth/authorize/?client_id=00456aebafcf4909b4c9ed6266591dc7&redirect_uri="+window.location+"&response_type=token");
		}
		
		var client = new Dropbox.Client({ key: "b1cfix5am7ryjeg" });
		client.authenticate(function(error, client) {
			if (error)
			{
				return showError(error);  
			}
			self.client = client;
			self.loadPhotos();
			setInterval($.proxy(self.nextPhoto, self), 5000);
		});

		setInterval($.proxy(this.updateTime, this), 1000);
		setInterval($.proxy(self.loadPhotos, self), 24 * 60 * 60 * 1000);
	},

	showError: function(error)
	{
		console.log(error);
		alert(error);
	},

	shuffle: function(array) {
	    var counter = array.length, temp, index;

	    // While there are elements in the array
	    while (counter > 0) {
	        // Pick a random index
	        index = Math.floor(Math.random() * counter);

	        // Decrease counter by 1
	        counter--;

	        // And swap the last element with it
	        temp = array[counter];
	        array[counter] = array[index];
	        array[index] = temp;
	    }

	    return array;
	},

	loadPhotos: function()
	{
		var self = this;
		self.photos = [];
		self.client.stat("/frame", { readDir: true }, function(error,folder, entries) {
		  	if (error) {
		    	return showError(error);  
		  	}
		  	for (var i = 0; i < entries.length; i++) {
		  		var entry = entries[i];
		  		if (entry.isFile)
		  		{
		  			self.photos.push(
		  				{ 
		  					src: (function(path){
		  						return function() { return self.client.thumbnailUrl(path, { size: "xl" })} 
		  					})(entry.path)
		  				});
		  		}
		  	};

			$.ajax({
				url: "https://api.instagram.com/v1/users/self/media/recent/?access_token="+self.instagramToken,
    			crossDomain: true,
    			dataType: "jsonp",
				success: function(data) {
					for (var i = 0; i < data.data.length; i++) {
						var image = data.data[i];
						if (image.type != "image")
							continue;
						self.photos.push(
							{ 
								src: (function(path){
										return function(){ return path; }
								})(image.images.standard_resolution.url)							 
							}
						);
					}
					self.shuffle(self.photos);
				}
			});	
		});
	},

	nextPhoto: function()
	{
		this.id = (this.id + 1) % this.photos.length;
		this.setPhoto(this.photos[this.id]);
	},

	setPhoto: function(photo)
	{
		var self = this;
		var url = photo.src();

		var i = document.createElement('img'); 
	    i.onload = function() {
	    	self.$photo.prop("src", url);
	    };
	    i.src = url;
		
		
	},

	updateTime: function()
	{
		var time = new Date();
		this.$hours.text(("0"+time.getHours()).slice(-2));
		this.$minutes.text(("0"+time.getMinutes()).slice(-2));
		this.$seconds.text(("0"+time.getSeconds()).slice(-2));
	}
};

$(function() { PhotoClock.start(); });