* [Build System](#build-system)
* [Features](#features)
* [Features to Come](#features-to-come)
* [Possible Additions](#possible-addition)

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

* Find the following element in the head in **/src/index.html**

```
<!-- See jsload.js for information and credits for the following script -->
    <script>
    // some minified looking code
    </script>
```

* Copy the entire text in the **dist/perm/production/jsLoading.js** file and
paste it by replacing the minified looking code

```
<!-- See jsload.js for information and credits for the following script -->
    <script>
    // PASTE HERE
    </script>
```

* If you later want to go back, you can copy the **dist/perm/production/jsLoading.min.js**
file into the same spot.

### Build System

If you want to fork or clone this repository and desire to manage the build
system, you should be able to do this by going to the root directory and running:

```
npm install
```

After this you can make sure that everything is built by running

`gulp`

and then you can run

`gulp watch`

Now you can edit the src files and the build files will be changed automatically.

### Features

* Overlay behind which the application initially loads
* Three tabs on the right side of the application opening up three boxes
    1. A list of theatres with a search and sort features
    2. A Twitter feed that can display a list of all theatre accounts related to
    Toronto theatre or just the individual currently selected account. Initially
    it displays a short feed with a limited number of posts but this can be
    expanded to a true feed for the account or list.
    3. A filters box that allows you to find only the theatres that identify
    with certain keywords.
* A set of markers on the map corresponding to the locations of theatre venues
and offices of theatre companies if they do not have a dedicated venue.
* Information about each theatre's mandate and a link to their website to find
information about upcoming shows.
* Directions from any location by transit (unreasonable locations provide
unreasonable results.)
* Credit div at the bottom.

#### Features to Come

* Get information straight from websites using server side code to display
current plays at various venues.
* Change UI, especially for phones, to make the experience more pleasing.
Transparent sliding boxes come to mind. Definitely a new opening graphic.

##### Possible additions

* Allow for favorites and setting like expanded Twitter feeds to be saved from
use to use. This should be local storage.
* Allow for new theatres to be added by users. This will only work if the
server-side database is set up to load the theatres.
* Talking icons, where each icon on the map "says" (think comic book style
graphic) what the latest Twitter post from a theatre company is. This would
require actually using the Twitter API