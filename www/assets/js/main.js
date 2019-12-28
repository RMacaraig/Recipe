//main firebase functionality for create recipes page
//calling firebase for data
(function($){
    "use strict";
    const rootDB = firebase.database();
    const storageRef =  firebase.storage().ref();

    //create submit recipe form
    $("#create-recipe-form").on("submit",function(e) {
        e.preventDefault()
        let recipeDetails = formToJsonObject("create-recipe-form"); console.log('Form Data As Json Object', recipeDetails);

        let reference = rootDB.ref('/recipes').push();
        let key = reference.key;

        let file = $("#recipe_image")[0].files[0];
        let fileExt = getFileExtention(file.name);
        let fullPath = `/recipes_images/${key}.${fileExt}`;
        var uploadFile = storageRef.child(fullPath).put(file);
        new Promise((resolve, reject) => {
            return uploadFile.on('state_changed', function (snapshot) {
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progress = Math.floor(progress);
                console.log({progress: progress, fileType: file.type, fileName: file.name});
            }, function (error) {
                reject({error: error});
            }, function () {

                return uploadFile.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                    resolve({downloadURL: downloadURL, fileType:  file.type, fileName: file.name});
                })
            });

    //capturing image
    }).then(imageMetadata => {
            console.log({imageMetadata});
        return reference.set({
            recipe_name : recipeDetails.recipe_name,
            ingredients: recipeDetails.ingredients,
            message : recipeDetails.message,
            recipe_image_meta: imageMetadata
        }).then(isset => {
            console.log({isset});
    }).catch(er => {
            console.error(er);
    });
    })

    })

    //connecting to firebase for recipe list
    firebase.database().ref('/recipes').on('child_added', recipeDetails => {
        if(recipeDetails.exists())
    {
        let id = recipeDetails.key;
        let recipe = recipeDetails.val();
        let recipe_list = $("#recipe-list");
        let image_url = "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/broccoli-parmesan-chicken-soup-ghk-1543266017.jpg?crop=1.00xw:0.668xh;0,0.155xh&amp;resize=60:*";
        if(recipe.recipe_image_meta){
            image_url = recipe.recipe_image_meta.downloadURL;
        }
        recipe_list.append(`
                <a href="view-recipe.html?recipe=${id}" id="recipe-${id}">
                    <li class="list-group-item">
                        <img src="${image_url}" width="50px" alt=""> ${recipe.recipe_name}
                    </li>
                </a>`);
    }
    }, error => {
        console.table(['error', error]);
    });

    //error checking for firebase
    firebase.database().ref('/recipes').on('child_changed', updatedrecipe => {
        if(updatedrecipe.exists())
    {
        let recipeDetails = updatedrecipe.val();
        recipeDetails.key = updatedrecipe.key;
        $(`#recipe-${recipeDetails.key}`).html(`
                <li>
                    <img src="${recipeDetails.recipe_image_meta.downloadURL}" alt=""> ${recipeDetails.recipe_name}
                </li>`);
    }
    }, error => {
        console.table(['error', error]);
    });

    //creating list for recipes
    function formToJsonObject(formId) {
        var formData = $("#" + formId).serializeArray();
        var dataArray;
        dataArray = {};
        for (var i in formData) {
            dataArray[formData[i].name.trim()] = formData[i].value.trim();
        }
        return dataArray;
    }
    function getFileExtention(filename){
        var a = filename.split(".");
        if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
            return "";
        }
        return a.pop();
    }
})(jQuery);