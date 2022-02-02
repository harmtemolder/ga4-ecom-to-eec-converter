// Require the necessary APIs
const dataLayer = require('copyFromDataLayer');
const JSON = require('JSON');
const makeTableMap = require('makeTableMap');
// Input settings
let ecom = data.GTMVariable ? data.GTMVariable : dataLayer('ecommerce', 1); // Data Layer Version 1
if (ecom) {
  if (JSON.stringify(ecom).indexOf('ecommerce') > 0) {
    ecom = ecom.ecommerce;
  }
  let event = dataLayer('event', 2);
  const itemParamMapTable = data.itemParamMapTable ? makeTableMap(data.itemParamMapTable, 'itemParam', 'paramIndex') : undefined;
  const checkoutEventTable = data.checkoutEventTable;
  // Manual mapping of Variables if GA4 Ecom Events are Custom Events
  if (data.mapManVariables && data.mapEcomEvents === 'mapMan') {
    data.mapManVariables.forEach((eventArray) => {
      if (eventArray.mapVariable === eventArray.mapVariableValue) {
        event = eventArray.mapGA4Events;
      }
    });
  }
  // EEC Ecom Action Definition
  const eecEventMapping = {
    'view_item_list': 'impressions',
    'select_item': 'click',
    'view_item': 'detail',
    'add_to_cart': 'add',
    'remove_from_cart': 'remove',
    'purchase': 'purchase',
    'refund': 'refund',
    'select_promotion': 'promoClick',
    'view_promotion': 'promoView'
  };
  let eecAction = eecEventMapping[event];
  // Checkout Mapping
  let checkoutOption;
  let checkoutStep;
  if (data.checkoutSettings) {
    data.checkoutSettings.forEach((checkoutArray) => {
      if (checkoutArray.GTMEvent === event && checkoutArray.GTMVariable === checkoutArray.GTMVariableValue) {
        eecAction = checkoutArray.checkoutAction;
        checkoutStep = checkoutArray.checkoutStep;
        checkoutOption = checkoutArray.checkoutOption;
      }
    });
  }
  if (eecAction) {
    const eecItems = ecom.items;
    if (eecItems) {
      if (eecAction === 'promoClick' || eecAction === 'promoView') {
        // EEC Promotions
        const promo = [];
        for (let i = 0; i < eecItems.length; i++) {
          promo.push({
            'id': eecItems[i].promotion_id,
            'name': eecItems[i].promotion_name,
            'creative': eecItems[i].creative_name,
            'position': eecItems[i].creative_slot
          });
        }
        if (eecAction === 'promoClick') {
          ecom = {
            ecommerce: {
              promoClick: {
                promotions: promo
              }
            }
          };
        }
        if (eecAction === 'promoView') {
          ecom = {
            ecommerce: {
              promoView: {
                promotions: promo
              }
            }
          };
        }
      } else {
        // EEC Products
        const items = [];
        let category;
        let item_list_name = ecom.item_list_name ? ecom.item_list_name : undefined;
        for (let i = 0; i < eecItems.length; i++) {
          const item = eecItems[i];
          if (item.item_category) {
            category = item.item_category.replace('/', '_');
          }
          if (item.item_category2) {
            category = category + '/' + item.item_category2.replace('/', '_');
          }
          if (item.item_category3) {
            category = category + '/' + item.item_category3.replace('/', '_');
          }
          if (item.item_category4) {
            category = category + '/' + item.item_category4.replace('/', '_');
          }
          if (item.item_category5) {
            category = category + '/' + item.item_category5.replace('/', '_');
          }
          items.push({
            'id': item.item_id,
            'name': item.item_name,
            'variant': item.item_variant,
            'brand': item.item_brand,
            'price': item.price,
            'quantity': item.quantity,
            'coupon': item.item_coupon,
            'category': category,
            'list': item.item_list_name ? item.item_list_name : item_list_name,
            'position': item.index ? item.index : undefined
          });
          // Custom Item Parameters to Product Dimensions & Metrics
          if (itemParamMapTable) {
            for (let param in item) {
              if (item.hasOwnProperty(param)) {
                if (itemParamMapTable[param]) {
                  items[i][itemParamMapTable[param]] = item[param];
                }
              }
            }
          }
        }
        if (eecAction === 'impressions') {
          ecom = {
            ecommerce: {
              impressions: items
            }
          };
        }
        if (eecAction === 'click') {
          const item_list_name = items[0].list ? items[0].list : undefined;
          ecom = {
            ecommerce: {
              click: {
                actionField: {
                  list: item_list_name
                },
                products: items
              }
            }
          };
        }
        if (eecAction === 'detail') {
          const item_list_name = items[0].list ? items[0].list : undefined;
          ecom = {
            ecommerce: {
              detail: {
                actionField: {
                  list: item_list_name
                },
                products: items
              }
            }
          };
        }
        if (eecAction === 'add') {
          const item_list_name = items[0].list ? items[0].list : undefined;
          ecom = {
            ecommerce: {
              add: {
                actionField: {
                  list: item_list_name
                },
                products: items
              }
            }
          };
        }
        if (eecAction === 'checkout') {
          ecom = {
            ecommerce: {
              checkout: {
                actionField: {
                  step: checkoutStep,
                  option: checkoutOption
                },
                products: items
              }
            }
          };
        }
        if (eecAction === 'checkout_option') {
          ecom = {
            ecommerce: {
              checkout: {
                actionField: {
                  step: checkoutStep,
                  option: checkoutOption
                }
              }
            }
          };
        }
        if (eecAction === 'remove') {
          ecom = {
            ecommerce: {
              remove: {
                products: items
              }
            }
          };
        }
        if (eecAction === 'purchase') {
          const transaction_id = ecom.transaction_id,
            affiliation = ecom.affiliation,
            value = ecom.value,
            tax = ecom.tax,
            shipping = ecom.shipping,
            coupon = ecom.coupon;
          ecom = {
            ecommerce: {
              purchase: {
                actionField: {
                  id: transaction_id,
                  affiliation: affiliation,
                  revenue: value,
                  tax: tax,
                  shipping: shipping,
                  coupon: coupon
                },
                products: items
              }
            }
          };
        }
        if (eecAction === 'refund') {
          const transaction_id = ecom.transaction_id;
          ecom = {
            ecommerce: {
              refund: {
                actionField: {
                  id: transaction_id
                },
                products: items
              }
            }
          };
        }
      }
      return ecom || undefined;
    }
  }
}
