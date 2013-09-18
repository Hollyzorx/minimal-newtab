(function() {
	var currentFolderId = 1;
	var indent = 2;
	var folderLevel = 0;
	var liCount = 0;
	var gmail;
	var gmailLiId;
	var ul = document.getElementById("bookmarks");
	var css = document.styleSheets[0];
	var store = window.localStorage;
	var gmailRe = new RegExp(/https:\/\/mail\.google\.com\/?(a\/.+\/)?/);

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
			setGmailCount(id, lastCount);
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
	
	
	addIcon = function(faviconURL){
		css.insertRule(
			"ul li:nth-of-type("+liCount+"):before { background: url("+faviconURL+") 100% 100% no-repeat; position: relative; top: 0.63em;} " 
		);
	}
	
	addBookmark = function(title, url){
		li = document.createElement("li");
		li.style.cssText = "margin-left: " + (indent * folderLevel) + "em;";		
		//Get Favicon and set up li:before
		addIcon("chrome://favicon/" + url);
		
		title = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		li.innerHTML = "<a href=\"" + (encodeURI(url)) + "\" >" + title + "</a>";
		//li.id = "bookmark_li_" + liCount;
		li.className = "folderId_" + currentFolderId;
		
		//Are we dealing with a gmail link?
		m = gmailRe.exec(url);
		if (m) {
			gmail = "https://mail.google.com/";
			gmail += m[1] ? m[1] : "mail/";
			gmail += "feed/atom";
			if (url.match(/https:\/\/mail\.google\.com.*/)) {
				li.id = "gmail_li_" + liCount;
				gmailLiId = li.id;
			}
		}
		
		ul.appendChild(li);
		
	};
	
	addFolder = function(title){
		li = document.createElement("li");
		li.style.cssText = "margin-left: " + (indent * folderLevel) + "em;";
		url = chrome.extension.getURL("arrow_right.png");
		addIcon( url )
		li.innerHTML = title;
		li.id = "folder_li_" + liCount;
		li.className = "folderId_" + currentFolderId;
		ul.appendChild(li);		
	}
	
	processNode = function(node) {
	
		//Test if it's a bookmark / folder.. but not an empty folder
		if( node.url || (node.children && node.children[0] != undefined) ) {
			
			liCount++;
			if(node.url) {
			
				//If parentId changed then last folder was finished
				if(node.parentId != currentFolderId) {
					folderLevel--;
					currentFolderId = node.parentId;
				}
				
				addBookmark(node.title, node.url);
				
			}
			else { 
				//Track folder depth using parentId
				currentFolderId = node.children[0].parentId;
				
				//Must be a folder with stuff in..
				addFolder(node.title);
				folderLevel++;
				
				//Now process any child bookmarks
				node.children.forEach( function(child) { processNode(child); });
			}
			
		}
	};
	
	toggleBookmarks = function(folder){
		bookmarksInFolder = document.querySelectorAll('li[class^='+folder);
		for (var i = 1; i < bookmarksInFolder.length ; i++) {
			if(bookmarksInFolder[i].style.display != 'none'){
				bookmarksInFolder[i].style.display = 'none';
			}
			else{
				bookmarksInFolder[i].style.display = 'block';
			}
		}
	};

	chrome.bookmarks.getTree( function(bookmarks) {
		var bookmarksBar = bookmarks[0].children[0].children;
		bookmarksBar.forEach( function(node){
			processNode(node); //build page
		});
		
		//update the last gmail link found
		if(gmailLiId){
			updateGmailCount(  gmailLiId , gmail);
		}
		
		//Add click event handlers to all folders
		var folders = document.querySelectorAll('li[id^="folder"');
		for (var i = 0; i < folders.length ; i++) {
			folders[i].addEventListener("click", 
			function (event) {
				event.preventDefault();
				// Lets hide/unhide related bookmarks,
				targetFolder = event.currentTarget.className;
				toggleBookmarks(targetFolder);
			}, 
			false);
			//Now lets hide contents as default:
			toggleBookmarks(folders[i].className);
		}
	
	});

}).call(this);
