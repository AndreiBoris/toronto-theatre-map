# Toronto Theatre Map

This is work-in-progress map of some theatres and theatre companies in Toronto,
Canada. You can check out [live version of the website here.](http://andreicommunication.github.io/toronto-theatre-map/) If there are any comments or issues you have with the app you can 
reach me at Andrei.Borissenko@gmail.com

## Work with the Code

### Directory Structure

The minified **index.html** in the root directory is what should be run if you want 
to view the site. 

The **src** directory holds a build index.html file and *this is what you should
edit* while using the [Gulp build system](#build-system) to keep the file in the root directory
updated.

If you want to update the scss or js, be sure to also use the **src/styles/** and 
**src/scripts** directories, respectively.

*If you are trying to do debugging on the javascript code and are finding that 
the console is referencing minified files*, you can change the code into 
development mode like this:

1. Find the following element in the head in **/src/index.html** 

```
<!-- See jsload.js for information and credits for the following script -->
    <script>
    // some minified looking code
    </script>
```

2. Copy the entire text in the **dist/perm/production/jsLoading.js** file and 
paste it by replacing the minified looking code

```
<!-- See jsload.js for information and credits for the following script -->
    <script>
    // PASTE HERE
    </script>
```

If you later want to go back, you can copy the **dist/perm/production/jsLoading.min.js**
file into the same spot.

### Build System

If you want to fork or clone this repository and desire to manage the build 
system, you should be able to do this by going to the root directory and running:

```
npm install --save-dev jshint gulp gulp-ruby-sass gulp-autoprefixer gulp-cssnano gulp-jshint gulp-uglify gulp-rename gulp-concat gulp-notify del gulp-htmlmin gulp-image-resize gulp-livereload
```

After this you can make sure that everything is built by running

`gulp`

and then you can run 

`gulp watch` 

Now you can edit the src files and the build files will be changed automatically.