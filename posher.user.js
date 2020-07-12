// ==UserScript==
// @name         Posher
// @namespace    posher.bitbased.net
// @version      0.5
// @updateURL    https://github.com/bitbased/posher/raw/master/posher.user.js
// @downloadURL  https://github.com/bitbased/posher/raw/master/posher.user.js
// @description  Poshmark assistant
// @author       bitbased
// @match        https://poshmark.com/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_setClipboard
// @grant GM_info
// @grant unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    let username = '';
    let activeFilter = undefined;

    if (window.sessionStorage['posher-filter-active'] === 'true') {
        activeFilter = '';
    }

    function escapeRegExp(string) {
        return string.replace(/[-.*+?&_^${}()|[\]\\\/]/g, '\\$&');
    }

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }

    function decorate(tile) {
        let actionsListElem = tile.getElementsByClassName('listing-actions-con')[0];
        let actionsBarElem = tile.getElementsByClassName('social-action-bar')[0]

        if (actionsListElem && actionsListElem.getElementsByClassName('share-followers').length === 0) {
            // create publish button
            `<li class="d-fl ai-c"><a class="share share-feed"><i class="icon feed"></i></a></li>`

            let shareElem = actionsListElem.getElementsByClassName('share')[0];
            let publishElem = document.createElement('li');
            let publishLinkElem = document.createElement('a');
            let publishIconElem = document.createElement('i');

            publishElem.setAttribute('class', 'd-fl ai-c');
            publishLinkElem.setAttribute('class', 'share-followers');
            publishIconElem.setAttribute('class', 'icon feed');

            publishLinkElem.appendChild(publishIconElem);
            publishElem.appendChild(publishLinkElem);
            actionsListElem.appendChild(publishElem);

            shareElem.addEventListener('click', (e) => {
                publishIconElem.setAttribute('class', 'icon progress-bar-checkmark');
            });

            publishElem.onclick = (e) => {
                actionsListElem.getElementsByClassName('share')[0].click();
                publishIconElem.setAttribute('class', 'icon progress-bar-checkmark');
                let waitIval;
                waitIval = setInterval(() => {
                    let shareElem = document.getElementsByClassName('share-wrapper-con')[0];
                    let shareModal = document.getElementsByClassName('share-modal')[0];
                    if (shareElem) {
                        // shareModal.setAttribute('style', 'display: none');
                        clearInterval(waitIval);
                        setTimeout(() => {
                            shareElem.click();
                        }, 1000);
                    }
                }, 50);
            }

            // replace comment with edit button for own listings
            if (tile.getElementsByClassName('creator')[0].getAttribute('href').endsWith('/' + username)) {
                let commentElem = actionsListElem.getElementsByClassName('comment')[0];

                let editElem = document.createElement('li');
                let editLinkElem = document.createElement('a');
                let editIconElem = document.createElement('i');
                editElem.setAttribute('class', 'd-fl ai-c');
                editLinkElem.setAttribute('class', 'edit-link');
                editIconElem.setAttribute('class', 'icon pencil');

                editLinkElem.setAttribute('href', '/edit-listing/' + tile.getAttribute('id'));

                editLinkElem.appendChild(editIconElem);
                editElem.appendChild(editLinkElem);

                editLinkElem.onclick = (e) => {
                    e.preventDefault();
                    let editFrame = document.getElementsByClassName('listing-iframe')[0] || document.createElement('iframe');
                    let modalBackdrop = document.createElement('div');
                    modalBackdrop.setAttribute('class', 'modal-backdrop in');
                    editFrame.setAttribute('class', 'listing-iframe');
                    editFrame.setAttribute('src', 'https://poshmark.com/edit-listing/' + tile.getAttribute('id'));
                    editFrame.setAttribute('style', 'width: calc(100vw - 100px); height: calc(100vh - 100px); left: 50px; top: 50px; position: fixed; z-index: 10000; border-radius: 6px;');
                    document.body.append(modalBackdrop);
                    document.body.append(editFrame);
                    let frameIval;

                    let dataTitle;
                    let dataBrand;
                    let dataOriginalPrice;
                    let dataListingPrice;
                    let dataSize;

                    let publishButton;

                    frameIval = setInterval(() => {
                        if (editFrame.contentWindow.location.href && !editFrame.contentWindow.location.href.includes('edit-listing')) {
                            // editFrame.setAttribute('style', 'width: calc(100vw - 100px); height: calc(100vh - 100px); left: 50px; top: 50px; position: fixed; z-index: 10000; border-radius: 6px; display: none');
                            try {
                                if (!editFrame.contentWindow.document.querySelector('.listing__image .carousel__inner img')) {
                                    return;
                                }
                                tile.querySelector('img.covershot').src = editFrame.contentWindow.document.querySelector('.listing__image .carousel__inner img').src;
                                tile.querySelector('.size .val').innerText = editFrame.contentWindow.document.querySelector('.listing__size-selector-con').innerText;
                            }
                            catch(err) {
                            }

                            clearInterval(frameIval);
                            frameIval = undefined;

                            document.body.removeChild(editFrame);
                            document.body.removeChild(modalBackdrop);
                        } else {
                            try {

                                dataTitle = (editFrame.contentWindow.document.querySelector("input[data-vv-name='title']") || {}).value || dataTitle;
                                dataBrand = (editFrame.contentWindow.document.querySelector("input[placeholder='Enter the Brand/Designer']") || {}).value || dataBrand;
                                dataOriginalPrice = (editFrame.contentWindow.document.querySelector("input[data-vv-name='originalPrice']") || {}).value || dataOriginalPrice;
                                dataListingPrice = (editFrame.contentWindow.document.querySelector("input[data-vv-name='listingPrice']") || {}).value || dataListingPrice;

                                if (!publishButton) {
                                    publishButton = editFrame.contentWindow.document.querySelector("[data-et-name='list_item']");
                                    if (publishButton) {
                                        publishButton.addEventListener('click', () => {
                                            try {
                                                tile.querySelector('.title').innerText = dataTitle;
                                                tile.querySelector(".price > .original").innerText = '$' + dataOriginalPrice;
                                                tile.querySelector(".price").innerHTML = tile.querySelector(".price").innerHTML.replace(/\$[0-9a-z]+&nbsp;/, '&nbsp;').replace('&nbsp;', '$' + dataListingPrice + '&nbsp;');
                                                tile.querySelector("[data-pa-name='listing_brand']").innerText = dataBrand;
                                            }
                                            catch (err) {
                                            }
                                        });
                                    }
                                }
                            }
                            catch(err) {
                            }
                        }

                    }, 250);
                    return false;
                };

                commentElem.parentElement.setAttribute('style', 'display: none');
                actionsListElem.insertBefore(editElem, shareElem.parentElement);
            }

        }

        if (actionsBarElem && actionsBarElem.getElementsByClassName('social-action-bar__share-followers').length === 0) {
            // create publish button
            `<div class="d--fl ai--c social-action-bar__action social-action-bar__share-followers"><i class="icon feed"></i></div>`
            let shareElem = actionsBarElem.getElementsByClassName('social-action-bar__share')[0];
            let publishElem = document.createElement('div');
            let publishIconElem = document.createElement('i');

            publishElem.setAttribute('class', 'd--fl ai--c social-action-bar__action social-action-bar__share-followers share-followers');
            publishIconElem.setAttribute('class', 'icon feed');

            publishElem.appendChild(publishIconElem);
            actionsBarElem.appendChild(publishElem);

            shareElem.addEventListener('click', (e) => {
                publishIconElem.setAttribute('class', 'icon progress-bar-checkmark');
            });

            publishElem.onclick = (e) => {
                actionsBarElem.getElementsByClassName('social-action-bar__share')[0].click();
                publishIconElem.setAttribute('class', 'icon progress-bar-checkmark');
                let waitIval;
                waitIval = setInterval(() => {
                    let shareElem = document.getElementsByClassName('share-wrapper-container')[0];
                    let shareModal = document.getElementsByClassName('share-modal')[0];
                    if (shareElem && shareModal) {
                        // shareModal.setAttribute('style', 'display: none');
                        clearInterval(waitIval);
                        setTimeout(() => {
                            shareElem.click();
                        }, 1000);
                    }
                }, 50);
            }
        }
    }

    function addAutoScroll() {
        let scrollToTop = document.getElementsByClassName('scroll-to-top')[0];
        let scrollToBottom = document.getElementsByClassName('scroll-to-bottom')[0];

        if (scrollToTop && !scrollToBottom) {
            let scrollElem = document.createElement('div');
            let scrollSpan = document.createElement('span');
            let scrollArrow = document.createElement('div');

            scrollElem.setAttribute('class', 'btn scroll-to-top scroll-to-bottom visible-desktop');
            scrollElem.setAttribute('style', 'bottom: 10px;');

            scrollSpan.setAttribute('class', 'txt');
            scrollSpan.innerText = 'Auto';

            scrollArrow.setAttribute('class', 'arrow arrow--dark arrow--up up-arrow');
            scrollArrow.setAttribute('style', 'transform: rotate(180deg); top: -10px; right: -13px;');

            scrollElem.appendChild(scrollSpan);
            // scrollElem.appendChild(scrollArrow);
            scrollToTop.parentElement.appendChild(scrollElem);

            let scrollIval;
            let endCounter = -1;
            scrollElem.onclick = () => {
                if (scrollIval) {
                    clearInterval(scrollIval);
                    scrollIval = undefined;
                    scrollSpan.innerText = "Auto"
                } else {
                    scrollSpan.innerText = "Stop"
                    scrollIval = setInterval(() => {
                        window.scrollBy({ top: 2000, left: 0, behavior: 'smooth'});
                        if (unsafeWindow.scrollY + 100 >= unsafeWindow.document.body.clientHeight - unsafeWindow.innerHeight) {
                            if (endCounter < 0) {
                                endCounter = 3; // wait 3 seconds for more items to load before auto-stopping
                            } else {
                                endCounter -= 1;
                            }
                            if (endCounter === 0) {
                                endCounter = -1;
                                clearInterval(scrollIval);
                                scrollIval = undefined;
                                scrollSpan.innerText = "Auto"
                            }
                        } else {
                            endCounter = -1;
                        }
                    }, 1000);
                }

            };
        }
    }

    let autoPublishIval;
    function autoPublish(publishCaption, autoScroll) {
        if (autoPublishIval) {
            clearInterval(autoPublishIval);
            autoPublishIval = undefined;
            publishCaption.innerText = "Auto Share";
            publishCaption.parentElement.parentElement.setAttribute('style', '');
        } else {
            publishCaption.innerText = "Stop Sharing";
            publishCaption.parentElement.parentElement.setAttribute('style', 'background: darkslategrey');

            autoScroll = window.location.href.includes('/closet/');

            autoScroll && window.scrollBy({ top: unsafeWindow.document.body.clientHeight, left: 0, behavior: 'smooth'});
            let endCounter = -1;
            autoPublishIval = setInterval(() => {
                autoScroll && window.scrollBy({ top: 2000, left: 0, behavior: 'smooth'});
                if (!autoScroll || unsafeWindow.scrollY + 100 >= unsafeWindow.document.body.clientHeight - unsafeWindow.innerHeight) {
                    if (endCounter < 0) {
                        endCounter = 3; // wait 3 seconds for more items to load before auto-stopping
                    } else {
                        endCounter -= 1;
                    }
                    if (!autoScroll || endCounter === 0) {
                        endCounter = -1;
                        clearInterval(autoPublishIval);
                        autoPublishIval = undefined;

                        // reached scroll end, begin publishing
                        let shareCallback = () => {
                            if (autoPublishIval) {
                                // only restart timeout if autoPublishIval hasn't been cleared
                                autoPublishIval = setTimeout(shareCallback, getRandomInt(4000, 8000)); // a bit of "human" variation
                            }
                            let shareModal = document.getElementsByClassName('modal-open')[0];
                            if (shareModal) {
                                // modal is still open, waiting for captcha / error?
                                clearInterval(autoPublishIval);
                                autoPublishIval = undefined;
                                publishCaption.innerText = "Share Stopped";
                                publishCaption.parentElement.parentElement.setAttribute('style', '');
                                return;
                            }
                            let elems = Array.from(unsafeWindow.document.querySelectorAll('.tile'));
                            let elem = autoScroll ? elems.pop() : elems.shift();
                            // skip recently shared items, and unavailable items
                            while (elem && (elem.getElementsByClassName('progress-bar-checkmark').length > 0 || elem.getElementsByClassName('sold-tag').length > 0 || elem.getElementsByClassName('not-for-sale-tag').length > 0)) {
                                elem = autoScroll ? elems.pop() : elems.shift();
                            }
                            if (elem) {
                                elem.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                // let shareElem = elem.getElementsByClassName('share')[0] || elem.getElementsByClassName('social-action-bar__share')[0];
                                let shareElem = elem.getElementsByClassName('share-followers')[0];
                                if (shareElem) {
                                    shareElem.click();
                                }
                            } else {
                                clearInterval(autoPublishIval);
                                autoPublishIval = undefined;
                                publishCaption.innerText = "Auto Share";
                                publishCaption.parentElement.parentElement.setAttribute('style', '');
                            }
                        };
                        autoPublishIval = setTimeout(shareCallback, 5000);

                    }
                } else {
                    endCounter = -1;
                }
            }, 1000);

        }
    }

    function addTools() {
        let accountHeaderA = document.getElementsByClassName('header__account-info-list')[0];
        let accountHeaderB = document.getElementsByClassName('account-info')[0];

        if (accountHeaderA && document.getElementsByClassName('header-publish-item').length === 0) {
            // NOTE: this header is used on home page feeds and search
            let accountHeader = accountHeaderA;
            accountHeader.setAttribute('style', 'white-space: nowrap');

            let usernameElem = accountHeader.querySelector('.dropdown__link');
            if (usernameElem) {
                username = usernameElem.getAttribute('href').replace(/^.*closet\//,'');
            }

            let publishItem = document.createElement('li');
            let publishLink = document.createElement('a');
            let publishIcon = document.createElement('i');
            let publishCaption = document.createElement('span');

            publishItem.setAttribute('class', 'header__account-info-list__item header-publish-item');
            publishLink.setAttribute('class', 'header__account-info__link');
            publishIcon.setAttribute('class', 'icon bundle-large-gray share-gray as--c');
            publishIcon.setAttribute('style', 'background-position: -1550px -21px');
            publishCaption.setAttribute('class', 'header__account-info__link__subtitle caption');
            publishCaption.innerText = 'Auto Share';

            // NOTE: don't auto scroll on feeds, search, or categories?
            publishItem.onclick = () => { publishCaption.innerText = "Stop Sharing"; autoPublish(publishCaption, false); };

            publishItem.appendChild(publishLink);
            publishLink.appendChild(publishIcon);
            publishLink.appendChild(publishCaption);

            accountHeader.prepend(publishItem);
        }
        if (accountHeaderB) {
            // match @media query
            accountHeaderB.setAttribute('style', unsafeWindow.innerWidth > 890 ? 'flex: 0 0 360px;' : '');
        }
        if (accountHeaderB && document.getElementsByClassName('header-publish-item').length === 0) {
            // NOTE: this header is used on listings/closets and shares
            let accountHeader = accountHeaderB;

            let usernameElem = accountHeader.querySelector('.dropdown-item > a');
            if (usernameElem) {
                username = usernameElem.getAttribute('href').replace(/^.*closet\//,'');
            }

            let publishItem = document.createElement('li');
            let publishLink = document.createElement('a');
            let publishIcon = document.createElement('i');
            let publishCaption = document.createElement('span');

            publishItem.setAttribute('class', 'dressing-rooms header-publish-item');
            publishLink.setAttribute('class', 'user-action');
            publishIcon.setAttribute('class', 'icon share-large-gray');
            publishCaption.setAttribute('class', 'subtitle');
            publishCaption.innerText = 'Auto Share';

            publishItem.onclick = () => { autoPublish(publishCaption, true); };

            publishItem.appendChild(publishLink);
            publishLink.appendChild(publishIcon);
            publishLink.appendChild(publishCaption);
            accountHeader.prepend(publishItem);
        }
    };

    function addSearchFilter() {
        let searchInput = document.getElementById('searchInput') || document.getElementById('user-search-box');

        if (typeof activeFilter !== 'undefined' && searchInput) {
            activeFilter = searchInput.value.toLowerCase();
        }

        let searchIcon = document.getElementsByClassName('search-icon')[0];
        let searchFilterButton = document.getElementsByClassName('search-filter-icon')[0];
        if (searchIcon && !searchFilterButton) {

            let filterButton = document.createElement('button');
            let filterIcon = document.createElement('i');
            filterButton.setAttribute('class', 'search-icon search-filter-icon');
            // filterButton.setAttribute('style', 'background: ');
            filterIcon.setAttribute('class', 'icon filter');
            filterButton.appendChild(filterIcon);

            filterButton.onclick = (e) => {
                e.preventDefault();
                if (typeof activeFilter === 'undefined') {
                    let searchInput = document.getElementById('searchInput') || document.getElementById('user-search-box');
                    activeFilter = searchInput.value.toLowerCase();
                    window.sessionStorage['posher-filter-active'] = 'true';
                } else {
                    activeFilter = undefined;
                    window.sessionStorage['posher-filter-active'] = 'false';
                }
                return false;
            }

            searchIcon.setAttribute('style', 'border-radius: 0px; margin-left: 0px; border-right: 2px solid #e6e2df');
            filterButton.setAttribute('style', 'margin-left: 0px;');
            searchIcon.parentElement.appendChild(filterButton);
        }

        if (searchFilterButton) {
            searchFilterButton.setAttribute('style', typeof activeFilter !== 'undefined' ? 'background: black' : '');
        }
    }

    function updateEditor() {
        let editorSections = document.getElementsByClassName('listing-editor__section');
        if (editorSections.length > 0 && editorSections[0].innerText.includes('UPLOAD PHOTOS')) {
            editorSections[0].parentElement.insertBefore(editorSections[1], editorSections[0]);

            // add secondary update button on top
            let editorHeading = document.getElementsByTagName('h1')[0];
            let editorHeader = document.getElementsByClassName('header__con')[0];
            let updateButton = document.querySelector("button[data-et-name='update']");
            let cancelButton = document.querySelector("[data-et-name='cancel']");

            if (updateButton && editorHeading) {
                // editorHeading.setAttribute('style', 'position: relative');

                let topUpdateButton = document.createElement('button');
                topUpdateButton.setAttribute('class', 'btn btn--primary btn--large btn--wide');
                topUpdateButton.setAttribute('style', 'position: absolute; right: 0px');
                topUpdateButton.innerHTML = "Update";
                topUpdateButton.onclick = () => {
                    updateButton.click();
                };
                // editorHeading.append(topUpdateButton);
                editorHeader.append(topUpdateButton);

                let topCancelButton = document.createElement('a');
                topCancelButton.setAttribute('class', 'td--ul tc--lg m--r--7 fw--light');
                topCancelButton.setAttribute('style', 'position: absolute; right: 130px');
                topCancelButton.innerHTML = "Cancel";
                topCancelButton.onclick = () => {
                    cancelButton.click();
                };
                editorHeader.append(topCancelButton);
            }
        }
    }

    setInterval(() => {
        addTools();
        if (username) {
            let regexFilter = activeFilter && new RegExp(escapeRegExp(activeFilter).replace(/"([^"]+)"/g,(_,_m) => _m.replace(/\s/g,'\\s')).replace(/ or (?=.|$)/g, '|').replace(/([^\s\|]+)\s*/g, '(?=.*$1)'), 'gi');
            // console.log(regexFilter);
            let elems = unsafeWindow.document.querySelectorAll('.tile');
            for (let elem of elems) {
                let elemStyle = elem.getAttribute('style');
                if (regexFilter && !regexFilter.test(elem.querySelector('.item__details, .item-details').innerText)) {
                    if (elemStyle !== 'display: none') {
                        elem.setAttribute('style', 'opacity: 0.25');
                    }
                } else {
                    if (elemStyle) {
                        elem.setAttribute('style', '');
                    }
                }
                decorate(elem);
            }
        }
        addSearchFilter();
        addAutoScroll();
        updateEditor();
    }, 250);

})();
