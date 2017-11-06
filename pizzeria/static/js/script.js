(function($) {
    $(function() {
        var productsList = [];
        var products = $('[data-product-id]');
        var fullPriceValue = $('#price-value');
        var fullPriceInCart = $('#full-price-in-cart');
        var fullPriceValueForRequest = 0;
        var inCookieCart = $.cookie('cart');
        var productsInCart = inCookieCart ? JSON.parse(inCookieCart) : {};

        var updateCart = function() {
            $.cookie('cart', JSON.stringify(productsInCart));
            reIniProductsList();
        };

        var addProductToCart = function(product) {
            productsInCart[product.id] = (productsInCart[product.id] || 0) + 1;
            updateCart();
        };

        var removeProductFromCart = function(product) {
            productsInCart[product.id] = productsInCart[product.id] ? productsInCart[product.id] - 1 : 0;
            updateCart();
        };

        var reIniProductsList = function() {
            fullPriceValueForRequest = 0;
            for (var productId in productsInCart) {
                var productData = productsList.filter(function(item) {
                    return item.id === productId;
                })[0];
                fullPriceValueForRequest+= productsInCart[productId] * productData.price;
                if (productsInCart[productId]) {
                    productData['cartAddBtn'].filter('.prod_button').hide();
                    productData['productInCart'].show();
                } else {
                    productData['cartAddBtn'].filter('.prod_button').show();
                    productData['productInCart'].hide();
                }
                productData['countSpan'].text(productsInCart[productId]);
            }
            fullPriceValue.text(fullPriceValueForRequest);
            fullPriceInCart.text(fullPriceValueForRequest);
        };

        var iniAddToCartBtn = function(data) {
            data['cartAddBtn'].on('click', function() {
                addProductToCart(data);
            });
            data['cartRemoveBtn'].on('click', function() {
                removeProductFromCart(data);
            });
        };

        products.each(function() {
            var _this = $(this);
            var addToCartButton = $('[data-add-to-cart]', _this);
            var removeFromCartButton = $('[data-remove-from-cart]', _this);
            var productItem = {
                id: _this.attr('data-product-id'),
                price: $('[data-price]:first', _this).text() * 1,
                name: $('[data-name]:first', _this).text(),
                productInCart: $('[data-cart-product]:first', _this),
                cartAddBtn: addToCartButton,
                cartRemoveBtn: removeFromCartButton,
                countSpan: $('[data-product-count]:first', _this)
            };
            productsList.push(productItem);
            iniAddToCartBtn(productItem);
        });


        reIniProductsList();


        var cartTable = $('#cart-table-with-products');

        var createItemRow = function(productInfo) {

            var cartItem = $('<div>').addClass('cart_table_tr');
            var cartItemName = $('<div>').addClass('cart_table_producttd').appendTo(cartItem).text(productInfo['name']);
            var cartItemCount = $('<div>').addClass('cart_table_act').appendTo(cartItem);
            var cartItemButtons = $('<div>').addClass('prod_price_act_buttons').appendTo(cartItemCount);
            var cartItemQuantity = $('<span>').addClass('incart_quantity').appendTo(cartItemButtons).text(productInfo['count']);
            var cartItemPrice = $('<div>').addClass('cart_table_price').appendTo(cartItem);
            var cartItemPriceValue = $('<span>').addClass('cart_table_price_value').appendTo(cartItemPrice).text(productInfo['count'] * productInfo['price']);
            cartItemPrice.append('&nbsp;<span class="rouble">i</span>');

            return cartItem;
        };

        var showCart = function() {
            if (!fullPriceValueForRequest) return;
            cartTable.html('');
            for (var productId in productsInCart) {
                var productData = productsList.filter(function(item) {
                    return item.id === productId;
                })[0];

                if (productsInCart[productId]) {
                    cartTable.append(createItemRow({
                        name: productData['name'],
                        count: productsInCart[productId],
                        price: productData['price']
                    }));
                }
            }

            $('#cart-popup-holder').show();
        };

        $('#show-cart-btn').on('click', showCart);
        $('#cart-closer').on('click', function(e) {
            if (!$(this).is(e.target)) return;
            $('#cart-popup-holder').hide();
        });

        $('#ether-pay-method').on('click', function() {
            var products = [];
            for (var productId in productsInCart) {
                var productData = productsList.filter(function(item) {
                    return item.id === productId;
                })[0];

                if (productsInCart[productId]) {
                    products.push({
                        name: productData['name'],
                        count: productsInCart[productId],
                        price: productData['price']
                    });
                }
            }
            var lastOrderId = (new Date()).getTime();
            var orderInformation = {
                orderId: lastOrderId,
                fullPrice: fullPriceValueForRequest,
                products: products,
                time: (new Date()).getTime()
            };
            $.cookie('order', JSON.stringify(orderInformation));

            var options = JSON.stringify({"price": fullPriceValueForRequest, "order": lastOrderId});
            window.location.href = 'http://localhost:9990/dashboard/anonymous?go=' + encodeURIComponent('/create/shopping?options=' + options);
        });

    })
})(jQuery);
