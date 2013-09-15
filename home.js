(function() {
	var addBookmark, addBookmarks, gmailRe, setGmailCount, store, ul, updateGmailCount;
	
	ul = document.getElementById("bookmarks");

	store = window.localStorage;

	gmailRe = new RegExp(/https:\/\/mail\.google\.com\/?(a\/.+\/)?/);

	//BUG IS IN HERE ////
	setGmailCount = function(id, count) {
		var countTemplate, klass, link, span;
		klass = count === "0" ? "zero" : "count";
		countTemplate = "<span class=" + klass + ">" + count + "</span>";
		span = document.getElementById(id + "_count");
		if (span) {
			return span.innerHTML = countTemplate;
		} else {
			link = document.getElementById(id);
			return link.innerHTML += " <span id='" + id + "_count'>" + countTemplate + "</span>";
		}
	};

	updateGmailCount = function(id, url) {
		var lastCount, xhr;
		lastCount = store.getItem(id + "_count");
		if (lastCount !== null) {
			//setGmailCount(id, lastCount);
			console.log("HIT");
		}
		if ((new Date()).getTime() - store.getItem(id + "_time") > 60000) {
			xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				var count, doc, parser, _ref;
				if (xhr.readyState === 4 && xhr.status === 200) {
					parser = new DOMParser();
					doc = parser.parseFromString(xhr.responseText, "text/xml");
					count = (_ref = doc.getElementsByTagName("fullcount")[0]) != null ? _ref.textContent : void 0;
					store.setItem(id + "_count", count);
					store.setItem(id + "_time", (new Date()).getTime());
					return setGmailCount(id, count);
				}
			};
			xhr.open("GET", url, true);
			return xhr.send();
		}
	};
	
	//MY STUFF/////////////////////////
	var currentParentId = 1;
	var indent = 2;
	var folderLevel = 0;
	var bookmarkCount = 0;
	
	addBookmark = function(title, url){
		li = document.createElement("li");
		li.style.cssText = "padding-left: " + (indent * folderLevel) + "em;";
		
		title = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		li.innerHTML = "<a href=\"" + (encodeURI(url)) + "\" id='bm_" + bookmarkCount + "'>" + title + "</a>";
		m = gmailRe.exec(url);
		if (m) {
			gmail = "https://mail.google.com/";
			gmail += m[1] ? m[1] : "mail/";
			gmail += "feed/atom";
			if (url.match(/https:\/\/mail\.google\.com.*/)) {
				updateGmailCount("bm_" + bookmarkCount, gmail);
			}
		}
		ul.appendChild(li);
		bookmarkCount++;
	};
	
	addFolder = function(title){
		li = document.createElement("li");
		li.style.cssText = "padding-left: " + (indent * folderLevel) + "em;";
		li.innerHTML = "&#x25be; " + title;
		ul.appendChild(li)
	}
	
	processNode = function(node) {
		if(node.children){
			if(node.children[0] === undefined ){
				//Empty Folder, let's not break the system now~
				console.log("Empty folder");
			}
			else { //We have a full folder!
			
				addFolder(node.title);
				
				//Track folder depth using parentId
				folderLevel++;
				currentParentId = node.children[0].parentId;
				
				//Now process any child bookmarks
				node.children.forEach( function(child) { processNode(child); });
			}
		}
		if(node.url) { //We have a bookmark!
			
			//If parentId changed then last folder was finished
			if(node.parentId != currentParentId) {
				console.log("change! " +node.parentId + currentParentId );
				folderLevel--;
				currentParentId = node.parentId;
			}
			addBookmark(node.title, node.url, node.parentId);
		}
	};
	
	chrome.bookmarks.getTree( function(bookmarks) {
		var bookmarksBar = bookmarks[0].children[0].children;
		bookmarksBar.forEach( function(node){
			processNode(node);
		});
		console.log(bookmarksBar);
	});
	///////////////////////
	
	chrome.bookmarks.getTree( function(bookmarks) {
		//return addBookmarks(bookmarks[0].children[0].children);
	});

}).call(this);
