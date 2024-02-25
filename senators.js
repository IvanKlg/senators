//=======================================================================================
//  ---------------------CUSTOM ERROR HANDLING-------------------------------------------
//clean error handling by making two child classes of "Error" inspired by https://javascript.info/custom-errors 
class NetworkError extends Error {
    //create and initialise object. 
    //We'll use messages passes in but set a default for a fallback 
    constructor(message) {
        //call constructor with the message 
        super(message || "Error with network response"); 
        //name it as NetworkError 
        this.name = "NetworkError";
    }
}

//same again for the parsing errors 
class ParsingError extends Error { 
    constructor(message) {
        super(message || "Error with JSON data parsing");
        this.name = "ParsingError";
    }
}
// ---------------------CUSTOM ERROR HANDLING END----------------------------------------
//=======================================================================================


//=======================================================================================
//  ---------------------FETCH FUNCTION START--------------------------------------------
async function fetchinfo() {
//array to hold info after processing 
let senatorinfo = []
    try {
        //try to fetch the data
        const response = await fetch("senators.json");
        // Idenfitying bad network responses
        if (!response.ok) {
            //throw the network error 
            throw new NetworkError("Error with network response: " + response.statusText);
        }
        //parse and put the data in the varaible "info"
        let info;
        try {
            info = await response.json();
        } catch (failedparsing) {
            //catch error if parsing fails
            throw new ParsingError("Error with JSON data parsing: " + failedparsing.message);
        }

        //call function to populate senatorinfo
        senatorsdetails(info, senatorinfo);

        //sort senatorinfo by party alphabetically 
        senatorinfo.sort((a, b) => {
            //if senator a's party comes alphabetically after senator b's party, return 1 and keep it that way
            if (a.party > b.party) return 1;
            //if its the opposite, return -1 and flip the order 
            if (a.party < b.party) return -1;
                //if they are the same party dont need to reorder them
                return 0;
        });

        //display senators on the webpage
        displaysenators(senatorinfo);
        //update the party bar 
        partyaffiliation(info);
        //display the leaders 
        leaders(info);


        //~~~~~~~~~MANAGING FILTERS~~~~~~~~~~~~~//
        //We need to find out the values in party, state and rank for the filters
        //We can use sets instead of lists here to only keep the unique items https://www.w3schools.com/js/js_object_sets.asp
        const parties = new Set();
        const states = new Set();
        const ranks = new Set();

        //add object info to the sets
        info.objects.forEach(s => {
            states.add(s.state);
            parties.add(s.party);
            ranks.add(s.senator_rank_label);
        })

        //add the content into each dropdown
        dropdowncontent("partydropdown", parties);
        dropdowncontent("statedropdown", states);
        dropdowncontent("rankdropdown", ranks);
        
        //event listeners to make the filters function 
        document.getElementById("partydropdown").addEventListener("change", () => filters(senatorinfo));
        document.getElementById("statedropdown").addEventListener("change", () => filters(senatorinfo));
        document.getElementById("rankdropdown").addEventListener("change", () => filters(senatorinfo));
       //~~~~~~~~~MANAGING FILTERS END~~~~~~~~~~~~~//

    //Logging what to do after the errors occur
    } catch (error) {
        if (error instanceof NetworkError) {
            console.error("Network error, please check your internet connection", error.message);
        } else if (error instanceof ParsingError) {
            console.error("Data parsing error; ", error.message);
        } else {
            console.error("There was a problem with the fetch: ", error.message);
        }
    }
}
// ---------------------FETCH FUNCTION END-----------------------------------------------
//=======================================================================================





//=======================================================================================
// ---------------------EVENT LISTENER FOR FETCH, NAVSCROLL AND SEARCH-------------------
//make sure to run the functions after the browser loads the HTML
document.addEventListener("DOMContentLoaded", function() {
    //call the fetch function when the html is loaded
    fetchinfo();
    //grab all the nav <a> elements
    const navelements = document.querySelectorAll(".navbar a");
    //iterate over each nav elementand call the navscroll function when clicked
    navelements.forEach(text => {
        text.addEventListener("click", navscroll);
    })
    //event listener for the searchbar to use an input instead of onkeyup
    document.getElementById('searchinput').addEventListener('input', searchfilter);
});
// ---------------------EVENT LISTENER FOR FETCH, NAVSCROLL AND SEARCH END---------------
//=======================================================================================





//=======================================================================================
// ---------------------SMOOTH SCROLL FOR NAV LINKS--------------------------------------
// Function to make scrolling smooth for the navbar elements
//https://www.w3schools.com/howto/howto_css_smooth_scroll.asp
function navscroll(event) {
    // stop the jumping scroll
    event.preventDefault();
    //grab the nav elements 
    let element = this.getAttribute("href");
    let pagepart = document.querySelector(element);
    //scroll to them
    if (pagepart) {
        pagepart.scrollIntoView({ behavior: "smooth"})
    }
}
// ---------------------SMOOTH SCROLL FOR NAV LINKS END----------------------------------
//=======================================================================================





//=======================================================================================
// ---------------------SENATOR PARTY INFORMATION AND DYNAMIC BAR------------------------
function partyaffiliation(info) { 
    //How many senators are in each party by looping through the json
    //set counter for each party 
    let democratcounter = 0;
    let repubcounter = 0;
    let indecounter = 0;

    //iterate over the party in each senator and increment counters accordingly 
    info.objects.forEach(s => { let party = s.party;
        if (party === "Democrat") {
            democratcounter++;
        } else if (party === "Republican") {
            repubcounter++;
        } else if (party === "Independent") {
            indecounter++;
        }
    });

    //finding the percentage of senators in each party 
    const max = repubcounter + democratcounter + indecounter;
    const dempercent = democratcounter / max * 100;
    const repubpercent = repubcounter / max * 100;
    const indepercent = indecounter / max * 100;

    //adjusting blue and red bars dynamically 
    const dembar = document.getElementById("democrat_blue");
    const repubbar = document.getElementById("repub_red");
    const indebar = document.getElementById("inde_gold");
    dembar.style.width = `${dempercent}%`; 
    repubbar.style.width = `${repubpercent}%`;
    indebar.style.width = `${indepercent}%`;

    //displaying the numbers on the bar
    dembar.querySelector('.barcontent').textContent = democratcounter;
    repubbar.querySelector('.barcontent').textContent = repubcounter;
    indebar.querySelector('.barcontent').textContent = indecounter;


    // whats in the tooltip content
    ttipcontent('democrat_blue', `Democrats: ${democratcounter}`);
    ttipcontent('repub_red', `Republicans: ${repubcounter}`);
    ttipcontent('inde_gold', `Independent: ${indecounter}`);
}
// ---------------------SENATOR PARTY INFORMATION AND DYNAMIC BAR END--------------------
//=======================================================================================





//=======================================================================================
// ---------------------TOOLTIP FOR PARTY BAR--------------------------------------------
//https://www.w3schools.com/css/css_tooltip.asp
function ttipcontent(barid, content) {
    const bar = document.getElementById(barid);
    if (bar) {
        const tooltip = bar.querySelector('.ttip');
        if (tooltip) {
            tooltip.textContent = content;
    } else {
        console.log(`Bar not found: ${barid}`);
    }
    }
}
// ---------------------SENATOR PARTY INFORMATION AND DYNAMIC BAR END--------------------
//=======================================================================================


//=======================================================================================
// ---------------------SENATOR LEADER INFORMATION---------------------------------------
function leaders(info) {
    //assign leaders in to party to a list
    let democratleaders = []
    let republeaders = []
    let independentleaders = []
    //need to filter out the non leaders and find the leader title, name and party 
    info.objects.forEach(s => { 
        let leaderstatus = s.leadership_title;
        let firstname = s.person.firstname;
        let surname = s.person.lastname;
        let party = s.party;
        if (leaderstatus != null) {
            //if they are a leader we want the title 
            let leadertitle = leaderstatus;
            
            //also need to deal with nicknames 
            if (s.person.nickname !== "") {
                firstname = s.person.nickname;  
            }

            //printing format 
            let printleader = `${leadertitle}: <span class="${party}Lead">${firstname} ${surname} (${party})</span>`; 

            //identify which party then add the party string to the end of it printleader string
            if (party === "Democrat") {
                democratleaders.push(printleader);
            } else if (party === "Republican") {
                republeaders.push(printleader);
            } else if (party === "Independent") {
                independentleaders.push(printleader);
            }
        }
    }); 
    
    //Put the leader content by mapping each leader to a list element
    let demoleadercontent = democratleaders.map((s) => `<li>${s}</li>`).join("");
    //keep each party seperate
    let republeadercontent = republeaders.map((s) => `<li>${s}</li>`).join("");
    let independentleadercontent = independentleaders.map((s) => `<li>${s}</li>`).join("");
    
    //display the lists
    document.getElementById("leaders").innerHTML = `<ul>${demoleadercontent}${republeadercontent}${independentleadercontent}</ul>`;

}
// ---------------------SENATOR LEADER INFORMATION END-----------------------------------
//=======================================================================================




//=======================================================================================
// ---------------------INDIVIDUAL SENATOR INFORMATION-----------------------------------
function senatorsdetails(info, senatorinfo) {
    //loop through each senator's info 
    info.objects.forEach((s) => {
        // main data and set to false if not there
        const firstname = s.person.firstname || false;
        const surname = s.person.lastname || false;
        const gender = s.person.gender_label[0] || false;
        const party = s.party || false;
        const state = s.state || false;
        const sen = s.person.name.slice(0, 4) || false; // extracting the Sen. for the title
        const rank = s.senator_rank_label || false;
        // additional data
        const bday = s.person.birthday || false;
        const office = s.extra.office || false;
        const startdate = s.startdate || false;
        let twitterlink = s.person.twitterid;
        let youtubelink = s.person.youtubeid;
        let websitelink = s.person.link;
        let youtube = "", twitter = "", website = "";
        let img_id = s.person.link.match(/\d+/) 

        //creating links for the social media if present
        if (youtubelink != null) {
            youtube = `<a href = "https://www.youtube.com/@${youtubelink}/featured" target = "_blank">Youtube</a>`
        } else {
            youtube = false
        }
        if (twitterlink != null) {
            twitter = `<a href = "https://Twitter.com/${twitterlink}" target = "_blank">Twitter</a>`
            } else {
                twitter = false
            }
        if (websitelink != null) {
            website = `<a href = "${s.person.link}" target = "_blank">Website</a>`
        } else {
            website = false 
        }
        // Pushing the info about the senator into the senatorinfo array
        senatorinfo.push({
            sen: sen,
            firstname: firstname, 
            surname: surname,
            gender: gender,
            party: party,
            state: state,
            rank: rank,
            img_id: img_id,
            addinfo: {
                Birthday: bday,
                Office: office,
                Started: startdate,
                youtube: youtube,
                twitter: twitter,
                website: website
            }
        });
    });
}
// ---------------------INDIVIDUAL SENATOR INFORMATION END-------------------------------
//=======================================================================================





//=======================================================================================
// ---------------------SENATOR SEARCH BAR--------------------
//function to do the search filtering inspired by w3schools
//https://www.w3schools.com/howto/howto_js_filter_lists.asp
function searchfilter() {
    //user input and filter based on it 
    const userinput = document.getElementById("searchinput");
    const filter = userinput.value.toUpperCase();
    const ul = document.getElementById("senators");
    const divs = ul.getElementsByClassName('senators');
    
    // Loop through list items and keep the ones that match the input 
    for (let i = 0; i < divs.length; i++) {
        const sendiv = divs[i];
        //get text content 
        const itemtext = sendiv.textContent || sendiv.innerText;

        //grab the additionalinfo div 
        const additionalInfoDiv = sendiv.nextElementSibling;
    
        if (itemtext.toUpperCase().indexOf(filter) > -1) {
            sendiv.classList.remove("hide");
            //need to make sure to keep or remove the additional info 
            additionalInfoDiv.classList.remove("hide");
        } else {
            sendiv.classList.add("hide");
            //add the additionalinfo 
            additionalInfoDiv.classList.add("hide");
        }
    }
}
    
// ---------------------SENATOR SEARCH BAR END-------------------------------------------
//=======================================================================================





//=======================================================================================
// ---------------------SENATOR DROPDOWN FILTER CONTENT----------------------------------
//https://www.w3schools.com/howto/howto_js_filter_elements.asp
function dropdowncontent(filter, input) {
    //grab each dropdown based on the filter id
    const drop = document.getElementById(filter);
    //make an option string designate what goes in the value part of <option> and the text part 
    let optionlist = [...input].map(item => `<option value = "${item}"> ${item}</option>`)
    .join("");
    //define a defaut and then add the list of options to the inner HTML
    drop.innerHTML = `<option value="default">Show all</option>${optionlist}`;
}
// ---------------------SENATOR DROPDOWN FILTER CONTENT END------------------------------
//=======================================================================================




//=======================================================================================
// ---------------------SENATOR LIST CONTENT AND ADDITIONAL DATA CALL--------------------
function displaysenators(filteredsenators) {
    //Display the info        
        let senatorcontent = ''
        for (senator of filteredsenators) {
            let mainInfo = `<div class="senators ${senator.party}" onclick="displayAdditionalData(this)">${senator.rank} ${senator.sen} ${senator.firstname} ${senator.surname} (${senator.gender}) Party: ${senator.party}, State: ${senator.state}</div>`
            senatorcontent += mainInfo

            let addinfo = `<div class="additionalInfo"><img data-imgid="${senator.img_id}"><ul>`
            for (key in senator.addinfo) {
                if (senator.addinfo[key]) {
                    if (['Birthday', 'Office', 'Started'].includes(key)) {
                        addinfo += `<li><b>${key}:</b> ${senator.addinfo[key]}</li>`
                    } else {
                        addinfo += `<li>${senator.addinfo[key]}</li>`
                    }
                }
            }
            addinfo += `</ul></div>`
            senatorcontent += addinfo
        }
        
    //set the inner html to this list
    document.getElementById("senators").innerHTML = `${senatorcontent}`;
}
// ---------------------SENATOR LIST CONTENT AND ADDITIONAL DATA CALL END----------------
//=======================================================================================





//=======================================================================================
// ---------------------FILTER FUNCTION--------------------------------------------------
function filters(senatorinfo) {
    //grab the user filter input from the dropdown 
    const partyfilterinput = document.getElementById("partydropdown").value;
    const statefilterinput = document.getElementById("statedropdown").value;
    const rankfilterinput = document.getElementById("rankdropdown").value;

    //either pick the defaul option for each filter or the user input if given
    if (partyfilterinput === "default") {
        //need to set the default sorts https://www.w3schools.com/js/js_array_sort.asp
        senatorinfo = senatorinfo.sort((a, b) => {
            //if senator a's party comes alphabetically after senator b's party, return 1 and keep it that way
            if (a.party > b.party) return 1;
            //if its the opposite, return -1 and flip the order 
            if (a.party < b.party) return -1;
                //if they are the same party dont need to reorder them
                return 0;
            });
    } 

    //if the input is not default, make sure the senator element matches the filter input
    if (partyfilterinput !== "default") {
        senatorinfo = senatorinfo.filter(s => s.party === partyfilterinput);
    } 
    if (statefilterinput !== "default") {
        senatorinfo = senatorinfo.filter(s => s.state === statefilterinput);
    }
    if (rankfilterinput !== "default") {
        senatorinfo = senatorinfo.filter(s => s.rank === rankfilterinput);
    }

    //call the displaysenators function with the filtered data
    displaysenators(senatorinfo)
}
// ---------------------FILTER FUNCTION END----------------------------------------------
//=======================================================================================





//=======================================================================================
// ---------------------DISPLAY ADDITIONAL DATA FUNCTION---------------------------------

// search and display of additional info
function displayAdditionalData(senator) {
    const additionalInfo = senator.nextElementSibling;
    const senatorPhoto = additionalInfo.firstElementChild;
    const photoID = senatorPhoto.getAttribute("data-imgid")
    const photoURL = `https://www.govtrack.us/static/legislator-photos/${photoID}-200px.jpeg`
    const partyName = senator.classList.item(1)
        
    // loading of image on click rather than all in advance is intentional 
    // intention is to prevent redundant upload, as most likely any user won't open all senators
    senatorPhoto.onload = function() {
        if (additionalInfo.style.maxHeight) {
            additionalInfo.style.maxHeight = null;
        } else {
            additionalInfo.style.maxHeight = additionalInfo.scrollHeight + "px";
        } 
        senator.classList.toggle(`${partyName}Open`)
    }

    // error handling is implementied in limited manner as this functionality is not critical
    senatorPhoto.onerror = function() {
        console.log("Couldn't load the photo")
        senatorPhoto.src = 'Images/placeholder.jpg'   
    }
    senatorPhoto.src = photoURL 
}
// ---------------------DISPLAY ADDITIONAL DATA FUNCTION END-----------------------------
//=======================================================================================