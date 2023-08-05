export default function PrimaryNav() {

    // cache dom elements
    var body = document.body,
        navTrigger = document.querySelector(".js-nav-trigger"),
        container = document.querySelector(".container"),
        primaryNav = document.querySelector(".js-primary-nav"),
        primaryNavLinks = document.querySelectorAll(".js-primary-nav a");

    // Flag that JS has loaded
    body.classList.remove("no-js");
    body.classList.add("js");

    // Hamburger menu
    navTrigger.addEventListener("click", function(){
        // toggle active class on the nav trigger
        this.classList.toggle("open");
        // toggle the active class on site container
        container.classList.toggle("js-nav-active");
    });

    // In-menu link click
    for(var i=0; i < primaryNavLinks.length; i++){
        var primaryNavLink = primaryNavLinks[i];
        primaryNavLink.onclick = function(){
            // toggle active class on the nav trigger
            navTrigger.classList.toggle("open");
            // immediately hide the nav
            primaryNav.style.opacity= "0";
            // once drawer has had time to pull up, restore opacity
            setTimeout(function() { primaryNav.style.opacity= "1"; }, 1000);
            // toggle the active class on site container
            container.classList.toggle("js-nav-active");
        };
    }

};
