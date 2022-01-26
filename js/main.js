/*
    Licenced under  GPL-3.0-or-later
*/

var profilesKey = 'dragonfable_profiles';
var profiles = $.jStorage.get(profilesKey, {});

(function($) {
    'use strict';

    var themes = {
        "Standard" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/lumen/bootstrap.min.css",
        "Cosmo" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/cosmo/bootstrap.min.css",
        "Cyborg" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/cyborg/bootstrap.min.css",
        "Darkly" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/darkly/bootstrap.min.css",
        "Flatly" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/flatly/bootstrap.min.css",
        "Journal" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/journal/bootstrap.min.css",
        "Light" : "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
        "Paper" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/paper/bootstrap.min.css",
        "Readable" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/readable/bootstrap.min.css",
        "Sandstone" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/sandstone/bootstrap.min.css",
        "Simplex" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/simplex/bootstrap.min.css",
        "Slate" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/slate/bootstrap.min.css",
        "Spacelab" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/spacelab/bootstrap.min.css",
        "Superhero" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/superhero/bootstrap.min.css",
        "United" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/united/bootstrap.min.css",
        "Yeti" : "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/yeti/bootstrap.min.css"
    };


    /// assure default values are set
    /// necessary 'cause we're abusing local storage to store JSON data
    /// done in a more verbose way to be easier to understand
    if (!('current' in profiles)) profiles.current = 'Default Profile';
    if (!(profilesKey in profiles)) profiles[profilesKey] = {};
    initializeProfile(profiles.current);

    jQuery(document).ready(function($) {
        // Get the right style going...
        themeSetup(buildThemeSelection());

        $('ul li[data-id]').each(function() {
            addCheckbox(this);
        });

        // Open external links in new tab
        $("a[href^='http']").attr('target','_blank');

        populateProfiles();

        $('.checkbox input[type="checkbox"]').click(function() {
            var id = $(this).attr('id');
            var isChecked = profiles[profilesKey][profiles.current].checklistData[id] = $(this).prop('checked');
            if (isChecked === true) {
              $('[data-id="'+id+'"] label').addClass('completed');
              $('[data-id="'+id+'"]').addClass('completed_item');
              tryAlsoCheck(this);
            } else {
              $('[data-id="'+id+'"] label').removeClass('completed');
              $('[data-id="'+id+'"]').removeClass('completed_item');
              tryAlsoUncheck(this);
            }
            $.jStorage.set(profilesKey, profiles);
            calculateTotals();
        });

        // Theme callback
        $('#themes').change(function(event) {
            var stylesheet = $('#themes').val();
            themeSetup(stylesheet);
            $.jStorage.set("style", stylesheet);
        });

        $('#level').change(function(event) {
            profiles[profilesKey][profiles.current].BiSDefaults.level = $("#level").val();
            updateBiSValues();
            $.jStorage.set(profilesKey, profiles);
        });

        $('#BiSSort').change(function(event) {
            profiles[profilesKey][profiles.current].BiSDefaults.sort = $("#BiSSort").val();
            updateBiSValues();
            $.jStorage.set(profilesKey, profiles);
        });

        $('#profiles').change(function(event) {
            profiles.current = $(this).val();
            $.jStorage.set(profilesKey, profiles);

            $('li .checkbox .completed').show();

            initializeProfile(profiles.current)

            populateChecklists();

            restoreState(profiles.current);

            calculateTotals();

            $("#current-profile").html(profiles.current);
        });

        $('#profileAdd').click(function() {
            $('#profileModalTitle').html('Add Profile');
            $('#profileModalName').val('');
            $('#profileModalAdd').show();
            $('#profileModalUpdate').hide();
            $('#profileModalDelete').hide();
            $('#profileModal').modal('show');
        });

        $('#profileEdit').click(function() {
            $('#profileModalTitle').html('Edit Profile');
            $('#profileModalName').val(profiles.current);
            $('#profileModalAdd').hide();
            $('#profileModalUpdate').show();
            if (canDelete()) {
                $('#profileModalDelete').show();
            } else {
                $('#profileModalDelete').hide();
            }
            $('#profileModal').modal('show');
        });

        $('#profileModalAdd').click(function(event) {
            event.preventDefault();
            var profile = $.trim($('#profileModalName').val());
            if (profile.length > 0) {
                initializeProfile(profile);


                chooseTheme("Standard");
                $("#current-profile").text(profile);
                profiles.current = profile;
                $.jStorage.set(profilesKey, profiles);
                populateProfiles();
                populateChecklists();
                restoreState(profiles.current);
            }
        });

        $('#profileModalUpdate').click(function(event) {
            event.preventDefault();
            var newName = $.trim($('#profileModalName').val());
            if (newName.length > 0 && newName != profiles.current) {
                profiles[profilesKey][newName] = profiles[profilesKey][profiles.current];
                delete profiles[profilesKey][profiles.current];
                profiles.current = newName;
                $.jStorage.set(profilesKey, profiles);
                populateProfiles();
            }
            $('#profileModal').modal('hide');
        });

        $('#profileModalDelete').click(function(event) {
            event.preventDefault();
            if (!canDelete()) {
                return;
            }
            if (!confirm('Are you sure?')) {
                return;
            }
            delete profiles[profilesKey][profiles.current];
            profiles.current = getFirstProfile();
            $("#current-profile").html(profiles.current);
            $.jStorage.set(profilesKey, profiles);
            populateProfiles();
            populateChecklists();
            $('#profileModal').modal('hide');
        });
        /*
        *  The only stipulation with this method is that it will only work with
        *  HTML5 ready browsers, should be the vast majority now...
        */
        $('#profileExport').click(function(){
          var filename = "profiles.json";
          var text = JSON.stringify(profiles);
          var element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' +
            encodeURIComponent(text));
          element.setAttribute('download', filename);
          element.style.display = 'none';
          document.body.appendChild(element);
          $(element).click(function(event){event.stopPropagation();});
          element.click();
          document.body.removeChild(element);
        });

        $('#profileImport').click(function(){
          $('#fileInput').trigger('click');
        });
        /* Will reject if an incorrect file or no file is selected */
        $('input#fileInput').change(function(){
          var fileInput = document.getElementById('fileInput');
          if(!fileInput.files || !fileInput.files[0] || !/\.json$/.test(fileInput.files[0].name)){
            alert("Bad input file. File should end in .json")
            return;
          }
          var fr = new FileReader();
          fr.readAsText(fileInput.files[0]);
          fr.onload = dataLoadCallback;
        });

        $("#toggleHideCompleted").change(function() {
            var hidden = !$(this).is(':checked');

            $('body').toggleClass('hide_completed', !hidden);

            profiles[profilesKey][profiles.current].hide_completed = !hidden;
            $.jStorage.set(profilesKey, profiles);
        });

        $('[data-item-toggle]').change(function() {
            var type = $(this).data('item-toggle');
            var to_hide = $(this).is(':checked');

            profiles[profilesKey][profiles.current].hidden_values[type] = to_hide;
            
            $.jStorage.set(profilesKey, profiles);

            toggleFilteredClasses(type);

            $.each(Object.keys(bisData), function(index, itemType) {
                showItem(findBestItem(itemType));
            });

            calculateTotals();
        });

        $("#options").click(function(event) {
            var dropdown = $("#options-dropdown");
            if (!dropdown.is(":visible")) {
                var wantedPlacement = $(this).offset().left+23.5-dropdown.width()/2;
                $("#options-dropdown").css("left", wantedPlacement);
                $("#options-dropdown").show();
                $("#options-triangle").show();
                keepOnScreen(dropdown, wantedPlacement);
                event.stopPropagation();
            }
        });

        $("#options-dropdown").click(function(event) {
            event.stopPropagation();
        });

        $("#fileInput").click(function(event) {
            event.stopPropagation();
        });

        $("#profileModal").click(function(event) {
            event.stopPropagation();
        });

        $(document).click(function() {
            $("#options-dropdown").hide();
            $("#options-triangle").hide();
            $("#themes-active").hide();
            $("#themes-inactive").show();
            $("#themes-selector").hide();
            $("#profile-active").hide();
            $("#profile-inactive").show();
            $("#profile-selector").hide();
        });

        for (let theme in themes) {
            $("#themes-selector").append('<label id="select-theme-' + theme + '" class="btn btn-default options-button">' + theme + '</label>');
            $("#select-theme-" + theme).click(function() {
                chooseTheme(theme);
            });
        }

        $("#change-theme").click(function(event) {
            $("#themes-selector").slideToggle(200);
            $("#themes-inactive").toggle();
            $("#themes-active").toggle();
            $("#profile-selector").hide(200);
            $("#profile-inactive").show();
            $("#profile-active").hide();
        });

        $("#change-profile").click(function(event) {
            $("#profile-selector").slideToggle(200);
            $("#profile-inactive").toggle();
            $("#profile-active").toggle();
            $("#themes-selector").hide(200);
            $("#themes-inactive").show();
            $("#themes-active").hide();
        });

        $("#select-theme-" + profiles[profilesKey][profiles.current].theme).addClass("active");

        $("#expand-all-btn").click(function(event) {
            $(".collapsed.expand-faq-button").each(function(index) {
                $(this).click();
            });
        });

        $("#collapse-all-btn").click(function(event) {
            $(".expand-faq-button").each(function(index) {
                $(this).click();
            });
        });

        $(".expand-faq-button").each(function(index) {
            $(this).click(function(event) {
                if ($(this).hasClass("collapsed") && $(".collapsed.expand-faq-button").length == 1) {
                    $("#expand-all-container").hide();
                    $("#collapse-all-container").show();
                } else {
                    $("#expand-all-container").show();
                    $("#collapse-all-container").hide();
                }
            });
        });

        setupBiS();
        calculateTotals();

    });

    /*
    *   This function will check if there are any other checkmarks that should also be checked when
    *   something is marked as "completed"
    */
    function tryAlsoCheck(el) {
        var alsoCheck = $(el).attr('also-check');
        if (typeof alsoCheck !== typeof undefined && alsoCheck !== false && profiles[profilesKey][profiles.current].checklistData[alsoCheck] != true) {
            $("#"+alsoCheck).click();
        }
    }

    /*
    *   This function is like the one above (tryAlsoCheck()), but the opposite
    *   It's for unchecking things
    */
    function tryAlsoUncheck(el) {
        var partOf = $(el).attr('part-of');
        if (typeof partOf !== typeof undefined && partOf !== false && profiles[profilesKey][profiles.current].checklistData[partOf] == true) {
            $("#"+partOf).click();
        }
    }

    function chooseTheme(theme) {
        let oldTheme = profiles[profilesKey][profiles.current].theme;
        if (!(theme == oldTheme)) {
            themeSetup(theme);
            $("#select-theme-" + oldTheme).removeClass("active");
            $("#select-theme-" + theme).addClass("active");
            profiles[profilesKey][profiles.current].theme = theme;
            $.jStorage.set(profilesKey, profiles);
        }
    }

    function initializeProfile(profile_name) {
        if (!(profile_name in profiles[profilesKey])) profiles[profilesKey][profile_name] = {};
        if (!('checklistData' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].checklistData = {
                checklist_4_7: true
            };
        if (!('state' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].state = {};
        if (!('collapsed' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].collapsed = {};
        if (!('current_tab' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].current_tab = '#tabStory';
        if (!('hide_completed' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].hide_completed = false;
        if (!('theme' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].theme ="Standard";
        var filters = {
            f_sidequest: false,
            f_unimportant: true,
            f_seasonal: true,
            g_bigDmgRange: false, 
            g_challenging: false, 
            g_farmIntense: false, 
            g_DC: true, 
            g_Rare: true,
            g_Seasonal: true, 
            g_DA: false,
            "g_Special Offer": true,
            g_Guardian: true,
            g_DM: false
        }
        if (!('hidden_values' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].hidden_values = {};
        $.each(filters, function(filter, defaultValue) {
            if (typeof profiles[profilesKey][profile_name].hidden_values[filter] === typeof undefined) {
                profiles[profilesKey][profile_name].hidden_values[filter] = defaultValue;
            }
        });
        if (!('BiSDefaults' in profiles[profilesKey][profile_name]))
            profiles[profilesKey][profile_name].BiSDefaults = {
                level: 90,
                sort: 'strOverall'
            };
    }

    /// restore all saved state, except for the current tab
    /// used on page load or when switching profiles
    function restoreState(profile_name) {
        $.each(profiles[profilesKey][profile_name].collapsed, function(key, value) {
            var $el = $('a[href="' + key + '"]');
            var active = $el.hasClass('collapsed');

            // interesting note: this condition is the same as (value ^ active),
            // but there's no logical xor in JS as far as I know; also, this is more readable
            if ((value && !active) || (!value && active)) {
                $el.click();
            }
        });

        var $button = $("#toggleHideCompleted");
        var hide_completed_state = profiles[profilesKey][profile_name].hide_completed;
        var button_active = $button.is(':checked');
        if ((hide_completed_state && !button_active) || (!hide_completed_state && button_active)) {
            $button.click();
        }

        $.each(profiles[profilesKey][profile_name].hidden_values, function(key, value) {
            var $el = $('[data-item-toggle="' + key + '"');
            var active = $el.is(':checked');

            if ((value && !active) || (!value && active)) {
                $el.click();
            }
            
            if (value && active) {
                $el.click();
                if ((value && !active) || (!value && active)) {
                    $el.click();
                }
            }
        });

        $("#level").val(profiles[profilesKey][profiles.current].BiSDefaults.level);

        $("#BiSSort").val(profiles[profilesKey][profiles.current].BiSDefaults.sort);

        $("#current-profile").html(profile_name)
    }

    function getUnderlineStyle(colors) {
        return ".underline-this:hover  {background: " + colors[0] + "}.active>.underline-this  {background: linear-gradient(to bottom, " + colors[2] + " 0%, " + colors[2] + " 95%, " + colors[3] + " 95%, " + colors[3] + " 100%);}";
    }

    // Setup ("bootstrap", haha) styling
    function themeSetup(stylesheet) {
        if(stylesheet === null || stylesheet === undefined) { // if we didn't get a param, then
            stylesheet = profiles[profilesKey][profiles.current].theme || "Standard"; // fall back on "light" if cookie not set
        }

        $("#bootstrap").attr("href", themes[stylesheet]);
        var customStyle = "";
        switch (stylesheet) {
            case "Cosmo":
                customStyle = getUnderlineStyle(["#222222", "#FFFFFF", "#222222", "#FFFFFF"]);
                customStyle += "#options {color: white}";
                customStyle += "#hide-completed {margin: 3.5px}";
                break;
            case "Cyborg":
                customStyle = getUnderlineStyle(["#060606", "#FFFFFF", "#060606", "#FFFFFF"]);
                customStyle += "#options {color: white}";
                customStyle += ".options-item {color: black}";
                customStyle += "#hide-completed {margin: 6px}";
                break;
            case "Darkly":
                customStyle = getUnderlineStyle(["#375A7F", "#00BC8C", "#375A7F", "#FFFFFF"]);
                customStyle += "#options-triangle::before {top: 37px}";
                customStyle += "#options-triangle::after {top: 39px}";
                customStyle += "#options-dropdown {top: 60px}";
                customStyle += "#options {color: white; padding: 16px 11px}";
                customStyle += ".options-item {color: black}";
                customStyle += "#hide-completed {margin: 7.5px}";
                break;
            case "Flatly":
                customStyle = getUnderlineStyle(["#2C3E50", "#18BC9C", "#2C3E50", "#FFFFFF"]);
                customStyle += "#options-triangle::before {top: 37px}";
                customStyle += "#options-triangle::after {top: 39px}";
                customStyle += "#options-dropdown {top: 60px}";
                customStyle += "#options {color: white; padding: 16px 11px}";
                customStyle += "#hide-completed {margin: 7.5px}";
                break;
            case "Journal":
                customStyle = getUnderlineStyle(["#FFFFFF", "#000000", "#FFFFFF", "#000000"]);
                customStyle += "#options-triangle::before {top: 38px}";
                customStyle += "#options-triangle::after {top: 40px}";
                customStyle += "#options-dropdown {top: 61px}";
                customStyle += "#options {padding: 16px 11px}";
                customStyle += "#hide-completed {margin: 11px}";
                break;
            case "Light":
                customStyle = getUnderlineStyle(["#F8F8F8", "#555555", "#F8F8F8", "#333333"]);
                customStyle += "#hide-completed {margin: 8.5px}";
                break;
            case "Paper":
                customStyle = getUnderlineStyle(["#FFFFFF", "#212121", "#FFFFFF", "#212121"]);
                customStyle += "#options-triangle::before {top: 41px}";
                customStyle += "#options-triangle::after {top: 43px}";
                customStyle += "#options-dropdown {top: 64px}";
                customStyle += "#options {padding: 17.5px 11px}";
                customStyle += "#hide-completed {margin: 14px}";
                break;
            case "Readable":
                customStyle = getUnderlineStyle(["#FFFFFF", "#4582EC", "#FFFFFF", "#4582EC"]);
                customStyle += "#options-triangle::before {top: 43px}";
                customStyle += "#options-triangle::after {top: 45px}";
                customStyle += "#options-dropdown {top: 66px}";
                customStyle += "#options {padding: 18.5px 11px}";
                customStyle += "#hide-completed {margin: 12px}";
                break;
            case "Sandstone":
                customStyle = getUnderlineStyle(["#3E3F3A", "#FFFFFF", "#3E3F3A", "#FFFFFF"]);
                customStyle += "#options-triangle::before {top: 40px}";
                customStyle += "#options-triangle::after {top: 42px}";
                customStyle += "#options-dropdown {top: 63px}";
                customStyle += "#options {color: white; padding: 17px 11px}";
                customStyle += "#hide-completed {margin: 8px}";
                break;
            case "Simplex":
                customStyle = getUnderlineStyle(["#FFFFFF", "#D9230F", "#FFFFFF", "#D9230F"]);
                customStyle += "#options-triangle::before {top: 18px}";
                customStyle += "#options-triangle::after {top: 20px}";
                customStyle += "#options-dropdown {top: 41px}";
                customStyle += "#options {padding: 6px 11px}";
                customStyle += "#hide-completed {margin: 1.5px}";
                break;
            case "Slate":
                customStyle = "#nav-collapse>.navbar-nav>li>.underline-this:hover  {background-image: linear-gradient(#484e55, #3a3f44 60%, #313539)}.container-fluid>#nav-collapse>.navbar-nav>.active>.underline-this  {background: linear-gradient(#484e55, #3a3f44 60%, #32363a 95%, #ffffff 95%);} ";
                customStyle += ".options-item {color: black}";
                customStyle += "#options {color: white}";
                customStyle += "#hide-completed {margin: 6px}";
                break;
            case "Spacelab":
                customStyle = ".container-fluid>#nav-collapse>.navbar-nav>li>.underline-this:hover  {backgorund: linear-gradient(#fff, #eee 50%, #e4e4e4)}.active>.underline-this  {background: linear-gradient(to bottom, #ffffff 0%,#eeeeee 50%,#e5e5e5 95%,#3399f3 95%,#3399f3 100%);} ";
                customStyle += "#options-triangle::before {top: 29px}";
                customStyle += "#options-triangle::after {top: 31px}";
                customStyle += "#options-dropdown {top: 52px}";
                customStyle += "#hide-completed {margin: 6px}";
                break;
            case "Superhero":
                customStyle = getUnderlineStyle(["#4E5D6C", "#EBEBEB", "#4E5D6C", "#EBEBEB"]);
                customStyle += "#options-triangle::before {top: 18px}";
                customStyle += "#options-triangle::after {top: 20px}";
                customStyle += "#options-dropdown {top: 41px}";
                customStyle += "#options {color: white; padding: 6px 11px}";
                customStyle += ".options-item {color: black}";
                customStyle += "#hide-completed {margin: 0.5px}";
                break;
            case "United":
                customStyle = getUnderlineStyle(["#DD4814", "#FFFFFF", "#DD4814", "#FFFFFF"]);
                customStyle += "#options {color: white}";
                customStyle += "#hide-completed {margin: 6px}";
                break;
            case "Yeti":
                customStyle = getUnderlineStyle(["#333333", "#FFFFFF", "#333333", "#FFFFFF"]);
                customStyle += "#options {color: white; padding: 8.5px 11px}";
                customStyle += "#options-triangle::before {top: 22px}";
                customStyle += "#options-triangle::after {top: 24px}";
                customStyle += "#options-dropdown {top: 45px}";
                customStyle += "#hide-completed {margin: 5px}";
                break;
            default:
                customStyle = getUnderlineStyle(["#F8F8F8", "#333333", "#F8F8F8", "#333333"]);
                customStyle += "#options-triangle::before {top: 31px}";
                customStyle += "#options-triangle::after {top: 33px}";
                customStyle += "#options-dropdown {top: 54px}";
                customStyle += "body {font-family: Arial, Helvetica, sans-serif}";
                customStyle += "#hide-completed {margin: 6.5px}";
        }

        $("#dynamicUnderlineStyles").html(customStyle);
    }

    function buildThemeSelection() {
        var style = profiles[profilesKey][profiles.current].theme || "Standard";
        var themeSelect = $("#themes");
        $.each(themes, function(key, value){
            themeSelect.append(
                $('<option></option>').val(key).html(key)
            );
        });
        themeSelect.val(style);
        $("#select-theme-" + style).addClass("active");
        return style;
    }

    function dataLoadCallback(arg){
      var jsonProfileData = JSON.parse(arg.currentTarget.result);
      profiles = jsonProfileData;
      $.jStorage.set(profilesKey, profiles);
      populateProfiles();
      populateChecklists();
      $('#profiles').trigger("change");
      location.reload();
    }

    function populateProfiles() {
        $('#profiles').empty();
        $.each(profiles[profilesKey], function(index, value) {
            $('#profiles').append($("<option></option>").attr('value', index).text(index));
        });
        $('#profiles').val(profiles.current);
    }

    function populateChecklists() {
        $('.checkbox input[type="checkbox"]')
            .prop('checked', false)
            .closest('label')
            .removeClass('completed')
            .closest('li').show();

        $.each(profiles[profilesKey][profiles.current].checklistData, function(index, value) {
            $('#' + index)
                .prop('checked', value)
                .closest('label')
                .toggleClass('completed', value);
        });

        calculateTotals();
    }

    function calculateTotals() {
        $('[id$="_overall_total"]').each(function(index) {
            var type = this.id.match(/(.*)_overall_total/)[1];
            var overallCount = 0, overallChecked = 0;
            $('[id^="' + type + '_totals_"]').each(function(index) {
                var regex = new RegExp(type + '_totals_(.*)');
                var regexFilter = new RegExp('^playthrough_(.*)');
                var i = parseInt(this.id.match(regex)[1]);
                var count = 0, checked = 0;
                for (var j = 1; ; j++) {
                    var checkbox = $('#' + type + '_' + i + '_' + j);
                    if (checkbox.length === 0) {
                        break;
                    }
                    if (checkbox.is(':hidden') && checkbox.prop('id').match(regexFilter) && canFilter(checkbox.closest('li'))) {
                        continue;
                    }
                    count++;
                    overallCount++;
                    if (checkbox.prop('checked')) {
                        checked++;
                        overallChecked++;
                    }
                }
                if (checked === count) {
                    this.innerHTML = $('#' + type + '_nav_totals_' + i)[0].innerHTML = 'DONE';
                    $(this).removeClass('in_progress').addClass('done');
                    $(this).parent('h3').addClass('completed');// Hide heading for completed category
                    $($('#' + type + '_nav_totals_' + i)[0]).removeClass('in_progress').addClass('done');
                } else {
                    this.innerHTML = $('#' + type + '_nav_totals_' + i)[0].innerHTML =  checked + '/' + count;
                    $(this).removeClass('done').addClass('in_progress');
                    $(this).parent('h3').removeClass('completed');// Show heading for not yet completed category
                    $($('#' + type + '_nav_totals_' + i)[0]).removeClass('done').addClass('in_progress');
                }
                $(this).parent('h3').next('div').children('h4').addClass('completed');// Hide all subheadings...
                $(this).parent('h3').next('div').children('ul').children('li').children('div').children('label:not(.completed)').parent('div').parent('li').parent('ul').prev('h4').removeClass('completed');// ... except those where not all entries below the subheading are labeled as completed
            });
            if (overallChecked === overallCount) {
                this.innerHTML = 'DONE';
                $(this).removeClass('in_progress').addClass('done');
            } else {
                this.innerHTML = overallChecked + '/' + overallCount;
                $(this).removeClass('done').addClass('in_progress');
            }
        });
    }

    function addCheckbox(el) {
        var $el = $(el);
        // assuming all content lies on the first line
        var content = $el.html().split('\n')[0];
        var sublists = $el.children('ul');
        var alsoCheckAttr = $el.attr('also-check');
        var partOfAttr = $el.attr('part-of');
        var infoText = $el.attr('info-text');
        var infoButtonHtml = "";
        var alsoCheck = "";
        var partOf = "";

        if (typeof infoText != typeof undefined && infoText != false) {
            infoButtonHtml = ' <span class="dropdown"><a class="dropdown-toggle" type="button" id="menu1" data-toggle="dropdown"><span style="cursor: pointer" class="glyphicon glyphicon-info-sign"></span></a><ul class="dropdown-menu" role="menu" aria-labelledby="menu1"><li role="presentation"><span role="menuitem" tabindex="-1">' + infoText + '</span></li></ul></span>';
        }

        if (typeof alsoCheckAttr != typeof undefined && alsoCheckAttr != false) {
            alsoCheck = 'also-check="' + alsoCheckAttr + '"';
        }

        if (typeof partOfAttr != typeof undefined && partOfAttr != false) {
            partOf = 'part-of="' + partOfAttr + '"';
        }

        content =
            '<div class="checkbox">' +
                '<label>' +
                    '<input type="checkbox" id="' + $el.attr('data-id') + '" ' + alsoCheck + ' ' + partOf + '>' +
                    '<span class="item_content">' + content + '</span>' +
                '</label>' +
                infoButtonHtml +
            '</div>';

        $el.html(content).append(sublists);

        $el.find(".dropdown").click(function(event){
            var listEntry = $(event.currentTarget);
            var button = listEntry.find(".glyphicon-info-sign");
            var dropdown = listEntry.find(".dropdown-menu");
            var wantedPlacement = button.offset().left;
            keepOnScreen(dropdown, wantedPlacement);
        });

        if (profiles[profilesKey][profiles.current].checklistData[$el.attr('data-id')] === true) {
            $('#' + $el.attr('data-id')).prop('checked', true);
            $('label', $el).addClass('completed');
            $($el).addClass('completed_item')
        }
    }

    function canDelete() {
        var count = 0;
        $.each(profiles[profilesKey], function(index, value) {
            count++;
        });
        return (count > 1);
    }
    function keepOnScreen(dropdown, wantedPlacement) {
        var outsideOfScreen = wantedPlacement+dropdown.width()+10-document.body.clientWidth;

        if (outsideOfScreen > 0) {
            dropdown.css("transform", "translate(-" + outsideOfScreen + "px)")
        } else {
            dropdown.css("transform", "translate(0px)")
        }
    }

    function getFirstProfile() {
        for (var profile in profiles[profilesKey]) {
            return profile;
        }
    }

    function canFilter(entry) {
        // Check if the entry even has a class
        if (!entry.attr('class')) {
            return false;
        }

        // classList is an array of the classes on entry
        var classList = entry.attr('class').split(/\s+/);
       

        var foundMatch = 0;
        // Iterate through all classes that entry has.
        for (var i = 0; i < classList.length; i++) {

            // If the class does not begin with "f_", do nothing and skip to the next class
            if (!classList[i].match(/^f_(.*)/)) {
                continue;
            }
            try {
                // Check if the class has data in the current profile
                if(classList[i] in profiles[profilesKey][profiles.current].hidden_values) {
                    // If the button for that class is checked, hide this
                    if(profiles[profilesKey][profiles.current].hidden_values[classList[i]]) {
                        return true;
                    }
                    // Otherwise, there's at least one button that is checked for this category
                    foundMatch = 1;
                }
            } catch (error) {
                console.log(error);
                console.log("classList[i] is: " + classList[i]);
                console.log(profiles[profilesKey][profiles.current]);
            }
            
        }
        // If no checked f_<class> was found, don't hide this
        return false;
    }

    function toggleFilteredClasses(str) {
        $("li." + str).each(function() {
            if(canFilter($(this))) {
                $(this).css('display', 'none');
            } else {
                $(this).css('display', '');
            }
        });
    }

    /*
     * -------------------------
     * Back to top functionality
     * -------------------------
     */
    $(function() {
        var offset = 220;
        var duration = 500;
        $(window).scroll(function() {
            if ($(this).scrollTop() > offset) {
                $('.back-to-top').fadeIn(duration);
            } else {
                $('.back-to-top').fadeOut(duration);
            }
        });

        $('.back-to-top').click(function(event) {
            event.preventDefault();
            $('html, body').animate({scrollTop: 0}, duration);
            return false;
        });
    });

    /*
     * ------------------------------------------
     * Restore tabs/hidden sections functionality
     * ------------------------------------------
     */
     $(function() {
        // reset `Hide completed` button state (otherwise Chrome bugs out)
        $('#toggleHideCompleted').attr('checked', false);

        // restore collapsed state on page load
        restoreState(profiles.current);

        $('.nav.navbar-nav li a').on('click', function(el) {
            profiles[profilesKey][profiles.current].current_tab = $(this).attr('href');
            if (profiles[profilesKey][profiles.current].current_tab == "#tabStory") {
                $("#hide-completed").show()
            } else {
                $("#hide-completed").hide()
            }
            $.jStorage.set(profilesKey, profiles);
        });

        var tabsList = ["#tabGear", "#tabStory", "#tabBadges", "#tabFAQ"];
        if ($.inArray(window.location.hash, tabsList) != -1) {
            profiles[profilesKey][profiles.current].current_tab = window.location.hash;
        }

        if (profiles[profilesKey][profiles.current].current_tab) {
            $('.nav.navbar-nav li a[href="' + profiles[profilesKey][profiles.current].current_tab + '"]').click();
        }

        // register on click handlers to store state
        $('a[href$="_col"]').on('click', function(el) {
            var collapsed_key = $(this).attr('href');
            var saved_tab_state = !!profiles[profilesKey][profiles.current].collapsed[collapsed_key];

            profiles[profilesKey][profiles.current].collapsed[$(this).attr('href')] = !saved_tab_state;

            $.jStorage.set(profilesKey, profiles);
        });


    });
})( jQuery );

// to color the plus symbol in combined item pickups
$(".p").html('<a style="pointer-events:none">&nbsp;+ </a>');
