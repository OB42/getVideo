# getVideo
This package permits you to get the url of the first video on a given page,
getVideo will use a headless browser if necessary.
Here is an example:
```
var getVideo = require("getvideo");
getVideo("https://youtube.com/watch?v=dQw4w9WgXcQ", (err, video) => {
    if(err){
        console.log(err);
    }
    else{
        console.log(video)
    }
});
```
