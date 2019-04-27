///////////////////////////////////
// create module
///////////////////////////////////

var Ecomm = angular.module('Ecomm', ['ngRoute']);

///////////////////////////////////
// configure routes
///////////////////////////////////

Ecomm.config(function ($routeProvider) {

    $routeProvider

        .when('/', {
            templateUrl: 'templates/home.html',
        })

        .when('/shopping', {
            templateUrl: 'templates/shopping.html',
        })

        .when('/product', {
            templateUrl: 'templates/product.html',
        })

        .when('/cart', {
            templateUrl: 'templates/cart.html',
            // controller: 'cartCtrl'
        })

        .when('/about', {
            templateUrl: 'templates/about.html',
        })

        .when('/contact', {
            templateUrl: 'templates/contact.html',
        })

});

///////////////////////////////////
// set up functions
///////////////////////////////////

var details
var product_items = [];
var product_in_stock = [];
var current_category;
var shopping_cart = [];
var sliderDataLoad
var prev_location

// get product data
function getProductData($scope) {
    $.ajax({
        type: 'GET',
        url: 'https://webmppcapstone.blob.core.windows.net/data/itemsdata.json',
        contentType: "application/json",
        dataType: "json",
        error: function () {
            console.log("Error");
        },
        success: function (response) {

            // save info
            details = response;
            console.log("Success");
            console.log(details);

            getAllProducts();

            // get products for slider
            $scope.slider_items = details[2].subcategories[0].items;
            sliderDataLoad = true;

            $scope.$apply(function () {
                // add category and subcategory titles
                $scope.products = details;
                // add products
                reloadProducts($scope);

            });

        }
    });
}

// load all products (initial view)
var product_count = 0;

function getAllProducts() {
    product_items = []

    // get product list
    for (var i in details) {
        for (var j in details[i].subcategories) {
            for (var k in details[i].subcategories[j].items) {
                product_items.push(details[i].subcategories[j].items[k]);

                // add 0 quantity value
                details[i].subcategories[j].items[k].quantity = 0;

                // add default sort
                product_count++;
                details[i].subcategories[j].items[k].default_order = product_count;
            }
        }
    }
}

// reload product view
function reloadProducts($scope) {
    $scope.displayed_products = product_items.length;
    $scope.number_of_products = product_items.length;
    $scope.product_items = product_items;
}

// get cart count
function getCartCount($scope) {

    $scope.cart_count = 0;
    $scope.shopping_cart = [];

    for (var i in details) {
        for (var j in details[i].subcategories) {
            for (var k in details[i].subcategories[j].items) {
                if (details[i].subcategories[j].items[k].quantity > 0) {
                    $scope.shopping_cart.push(details[i].subcategories[j].items[k]);
                    $scope.cart_count += details[i].subcategories[j].items[k].quantity;
                }
            }
        }
    }

}

// calculate cart cost
function cartCalc($scope) {

    $scope.subtotal = 0;
    $scope.shipping_cost = 10;

    for (var i in details) {
        for (var j in details[i].subcategories) {
            for (var k in details[i].subcategories[j].items) {
                if (details[i].subcategories[j].items[k].quantity > 0) {
                    var temp = details[i].subcategories[j].items[k];
                    $scope.subtotal += ((temp.quantity) * (temp.price));
                }
            }
        }
    }

    $scope.tax = ((10 / 100) * ($scope.subtotal + $scope.shipping_cost));
    $scope.total_cost = ($scope.subtotal + $scope.shipping_cost + $scope.tax);

}

// sort products
function sortProducts(products, sortType) {
    if (sortType === "none") {
        products.sort((a, b) => (a.default_order > b.default_order) ? 1 : -1);
    } else if (sortType === "price") {
        products.sort((a, b) => (a.price > b.price) ? 1 : -1);
    } else if (sortType === "alphabetical") {
        products.sort((a, b) => (a.name > b.name) ? 1 : -1);
    } else if (sortType === "rating") {
        // sort rating high to low // and alphabetically by product name
        products.sort((a, b) => (b.rating > a.rating) ? 1 : (b.rating === a.rating) ? ((a.name > b.name) ? 1 : -1) : -1)
    }
}

///////////////////////////////////
// create controllers
///////////////////////////////////

Ecomm.controller('mainCtrl', function ($scope) {

    // set initial values
    $scope.cart_count = 0;
    $scope.selected_category = "All Categories";
    $scope.shopping_cart = shopping_cart;
    $scope.sort_by = "none";

    getProductData($scope);

    ///////////////////////////////////
    // load products from clicked cat
    ///////////////////////////////////

    // click event
    $scope.loadProducts = function (temp) {

        console.log($scope.sort_by);

        product_in_stock = [];
        product_items = []

        if (temp === "in-stock") {
            temp = current_category;
        }

        // show products in all categories

        if (temp === undefined) {

            // get products in stock
            for (var i in details) {
                for (var j in details[i].subcategories) {
                    for (var k in details[i].subcategories[j].items) {
                        if (details[i].subcategories[j].items[k].stock > 0) {
                            product_in_stock.push(details[i].subcategories[j].items[k]);
                        }
                    }
                }
            }

            // get all products regardless of stock
            getAllProducts();

        }
        // show products in selected category
        else {

            // update display text
            $scope.selected_category = temp;
            current_category = temp;

            for (var i in details) {
                for (var j in details[i].subcategories) {
                    if (details[i].subcategories[j].name === temp) {
                        for (var k in details[i].subcategories[j].items) {

                            // get products in stock
                            if (details[i].subcategories[j].items[k].stock > 0) {
                                product_in_stock.push(details[i].subcategories[j].items[k]);
                            }

                            // get all products regardless of stock
                            product_items.push(details[i].subcategories[j].items[k]);

                        }
                    }
                }
            }
        }

        // reload product view
        if ($('#in-stock').is(":checked")) {

            // sort by selected option
            sortProducts(product_in_stock, $scope.sort_by);

            // reload products
            $scope.displayed_products = product_in_stock.length;
            $scope.number_of_products = product_items.length;
            $scope.product_items = product_in_stock;

        } else {

            // sort by selected option
            sortProducts(product_items, $scope.sort_by);

            // reload products
            reloadProducts($scope);

        }

    };

    ///////////////////////////////////
    // add item to cart
    ///////////////////////////////////

    $scope.addToCart = function (initiator, product) {

        if (initiator === "shopping-page") {

            for (var i in details) {
                for (var j in details[i].subcategories) {
                    for (var k in details[i].subcategories[j].items) {
                        if (details[i].subcategories[j].items[k].name === product) {
                            details[i].subcategories[j].items[k].quantity++;
                        }
                    }
                }
            }

        } else if (initiator === "product-page") {

            var quantitySelected = parseInt($("#product-page-quantity").val());

            for (var i in details) {
                for (var j in details[i].subcategories) {
                    for (var k in details[i].subcategories[j].items) {
                        if (details[i].subcategories[j].items[k].name === product) {
                            details[i].subcategories[j].items[k].quantity += quantitySelected;
                        }
                    }
                }
            }

        }

        getCartCount($scope);
        cartCalc($scope);

    };

    ///////////////////////////////////
    // load product page
    ///////////////////////////////////

    $scope.productPage = function (product) {

        prev_location = location.hash;

        var current_product = product;
        var product_string = product.toLowerCase().replace(/\s/g, '');
        window.location.hash = "#product?name=" + product_string;

        for (var i in details) {
            for (var j in details[i].subcategories) {
                for (var k in details[i].subcategories[j].items) {
                    if (details[i].subcategories[j].items[k].name === current_product) {
                        var selectedItem = details[i].subcategories[j].items[k];

                        $scope.product_name = selectedItem.name
                        $scope.image_url = selectedItem.imagelink
                        $scope.product_rating = selectedItem.rating
                        $scope.stock_val = selectedItem.stock
                        $scope.product_price = selectedItem.price
                        $scope.description = selectedItem.description

                    }
                }
            }
        }

    };

    ///////////////////////////////////
    // edit quantity
    ///////////////////////////////////

    $scope.editQty = function (initiator, sumType, product) {

        if (initiator === "product-page") {

            var initialValue = parseInt($("#product-page-quantity").val());
            var newValue = initialValue;

            // var quantitySelected = parseInt($("#product-page-quantity").val());

            if (sumType === "subtract") {
                if (initialValue > 0) {
                    newValue -= 1;
                }
            } else if (sumType === "add") {
                newValue++;
            }

            $("#product-page-quantity").val(newValue);

        } else if (initiator === "cart-page") {

            for (var i in details) {
                for (var j in details[i].subcategories) {
                    for (var k in details[i].subcategories[j].items) {
                        if (details[i].subcategories[j].items[k].name === product) {

                            var initialValue = details[i].subcategories[j].items[k].quantity;

                            if (sumType === "subtract") {
                                if (initialValue > 0) {
                                    details[i].subcategories[j].items[k].quantity -= 1;
                                }
                            } else if (sumType === "add") {
                                details[i].subcategories[j].items[k].quantity++;
                            }
                        }
                    }
                }
            }

            cartCalc($scope);

        }

        getCartCount($scope);

    };

    ///////////////////////////////////
    // delete item from cart
    ///////////////////////////////////

    $scope.deleteItem = function (product) {

        console.log("clicked")

        for (var i in details) {
            for (var j in details[i].subcategories) {
                for (var k in details[i].subcategories[j].items) {
                    if (details[i].subcategories[j].items[k].name === product) {
                        details[i].subcategories[j].items[k].quantity = 0;
                    }
                }
            }
        }

        getCartCount($scope);
        cartCalc($scope);

    };

    ///////////////////////////////////
    // back button
    ///////////////////////////////////

    $scope.goBack = function () {
        window.location.hash = prev_location;
    };

    ///////////////////////////////////
    // product sort
    ///////////////////////////////////

    $scope.sortBy = function (sortType) {
        $scope.sort_by = sortType;
        sortProducts(product_items, sortType);
        sortProducts(product_in_stock, sortType);
    };

    ///////////////////////////////////
    // checkout
    ///////////////////////////////////

    $scope.checkout = function () {

        var form_fields = ["checkout_name", "checkout_address", "checkout_city", "checkout_phone"];

        for (var i in form_fields) {
            if ($("#" + form_fields[i]).val() === "") {
                $("#" + form_fields[i]).addClass("is-invalid");
            } else {
                // clear error on form resubmit
                $("#" + form_fields[i]).removeClass("is-invalid");
            }
        }

        if ($(".is-invalid").length > 0) {
            $(".validation-message").removeClass("d-none");
        } else {
            $(".validation-message").addClass("d-none");

            // show success modal
            $('#checkout-success').modal('show');
            $scope.user_name = $("#checkout_name").val();
            $scope.user_address = $("#checkout_address").val();
            $scope.user_city = $("#checkout_city").val();

            // clear cart
            $scope.shopping_cart = [];
            $scope.cart_count = 0;

            // clear checkout form fields
            for (var i in form_fields) {
                $("#" + form_fields[i]).val("");
            }

        }

    };

    ///////////////////////////////////
    // contact form
    ///////////////////////////////////

    $scope.contactSubmit = function () {

        var form_fields = ["contact_name", "contact_email", "contact_subject", "contact_message"];

        for (var i in form_fields) {
            if ($("#" + form_fields[i]).val() === "") {
                $("#" + form_fields[i]).addClass("is-invalid");
            } else if (form_fields[i] === "contact_subject") {
                if ($("#contact_subject").find(":selected").text() === "Subject") {
                    $("#" + form_fields[i]).addClass("is-invalid");
                } else {
                    $("#" + form_fields[i]).removeClass("is-invalid");
                }
            } else {
                // clear error on form resubmit
                $("#" + form_fields[i]).removeClass("is-invalid");
            }
        }

        if ($(".is-invalid").length > 0) {
            $(".validation-message").removeClass("d-none");
        } else {
            $(".validation-message").addClass("d-none");

            // show success modal
            $('#contact-success').modal('show');
            $scope.user_name = $("#contact_name").val();
            $scope.user_subject = $("#contact_subject").find(":selected").text()

            // clear checkout form fields
            for (var i in form_fields) {
                $("#" + form_fields[i]).val("");
            }
            $('select>option:eq(0)').prop('selected', true);

        }

    };

});