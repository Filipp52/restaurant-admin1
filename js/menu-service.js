// Сервис работы с меню (товары, категории, топпинги) с улучшенной логикой
class MenuService {
    constructor() {
        this.markedProductTypes = [
            'WATER_MARKED',
            'DAIRY_MARKED',
            'JUICE_MARKED',
            'NOT_ALCOHOL_BEER_MARKED'
        ];
    }

    // ========== РАБОТА С ТОВАРАМИ ==========

    // Получение всех товаров
    async getProducts(onlyActive = false) {
        try {
            const endpoint = `/menu/products?only_active=${onlyActive}`;
            console.log('🔄 Fetching products from:', endpoint);

            const products = await apiService.get(endpoint);
            console.log('✅ Products received:', products);

            if (!Array.isArray(products)) {
                console.warn('⚠️ Products is not an array:', products);
                return [];
            }

            return products.map(product => this.enrichProductData(product));
        } catch (error) {
            console.error('❌ Failed to get products:', error);
            errorLogger.manualLog(error);

            // Возвращаем пустой массив вместо выброса ошибки
            return [];
        }
    }

    // Обогащение данных товара для отображения
    enrichProductData(product) {
        const enriched = { ...product };

        // Расчет цены для отображения
        if (product.qty_measure === 'GRAMS' && product.qty_default > 0) {
            // Для весовых товаров показываем цену за количество по умолчанию
            enriched.display_price = (product.unit_price * product.qty_default / 1000).toFixed(2);
            enriched.display_unit = '₽';
        } else {
            // Для штучных товаров показываем цену за штуку
            enriched.display_price = product.unit_price.toFixed(2);
            enriched.display_unit = '₽';
        }

        return enriched;
    }

    // Получение товара по ID
    async getProduct(productId) {
        try {
            const product = await apiService.get(`/menu/products/${productId}`);
            return this.enrichProductData(product);
        } catch (error) {
            console.error('Failed to get product:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Создание товара
    async createProduct(productData) {
        try {
            const requiredFields = ['name', 'type', 'tax', 'qty_measure', 'qty_min', 'qty_max', 'qty_default', 'unit_price'];
            const missingFields = requiredFields.filter(field => !productData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            }

            // Валидация для маркированных товаров
            if (this.isMarkedProductType(productData.type)) {
                if (productData.qty_measure !== 'PIECES') {
                    throw new Error('Маркированные товары могут быть только штучными');
                }
                if (productData.qty_max !== 1) {
                    throw new Error('Маркированные товары могут иметь максимальное количество только 1');
                }
                if (productData.qty_default !== 1) {
                    throw new Error('Маркированные товары могут иметь количество по умолчанию только 1');
                }
            }

            const requestBody = {
                name: productData.name,
                type: productData.type,
                tax: productData.tax,
                qty_measure: productData.qty_measure,
                qty_min: parseInt(productData.qty_min),
                qty_max: parseInt(productData.qty_max),
                qty_default: parseInt(productData.qty_default),
                unit_price: parseFloat(productData.unit_price),
                is_active: productData.is_active !== undefined ? productData.is_active : true
            };

            return await apiService.post('/menu/products', requestBody);
        } catch (error) {
            console.error('Failed to create product:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Редактирование товара
    async updateProduct(productId, productData) {
        try {
            const requestBody = {};

            // Добавляем только те поля, которые были переданы
            if (productData.name !== undefined) requestBody.name = productData.name;
            if (productData.type !== undefined) requestBody.type = productData.type;
            if (productData.tax !== undefined) requestBody.tax = productData.tax;
            if (productData.qty_min !== undefined) requestBody.qty_min = productData.qty_min;
            if (productData.qty_max !== undefined) requestBody.qty_max = productData.qty_max;
            if (productData.qty_default !== undefined) requestBody.qty_default = productData.qty_default;
            if (productData.unit_price !== undefined) requestBody.unit_price = parseFloat(productData.unit_price);
            if (productData.is_active !== undefined) requestBody.is_active = productData.is_active;

            return await apiService.patch(`/menu/products/${productId}`, requestBody);
        } catch (error) {
            console.error('Failed to update product:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Удаление товара
    async deleteProduct(productId) {
        try {
            return await apiService.delete(`/menu/products/${productId}`);
        } catch (error) {
            console.error('Failed to delete product:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Загрузка изображения товара
    async uploadProductImage(productId, file) {
        try {
            return await apiService.uploadFile(`/menu/products/${productId}/image`, file);
        } catch (error) {
            console.error('Failed to upload product image:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Получение информации об изображении товара
    async getProductImageInfo(productId) {
        try {
            return await apiService.get(`/menu/products/${productId}/image/info`);
        } catch (error) {
            console.error('Failed to get product image info:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // ========== РАБОТА С КАТЕГОРИЯМИ ==========

    // Получение всех категорий
    async getCategories(onlyActive = false) {
        try {
            return await apiService.get(`/menu/categories?only_active=${onlyActive}`);
        } catch (error) {
            console.error('Failed to get categories:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Получение категории по ID
    async getCategory(categoryId) {
        try {
            return await apiService.get(`/menu/categories/${categoryId}`);
        } catch (error) {
            console.error('Failed to get category:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Создание категории
    async createCategory(categoryData) {
        try {
            const requestBody = {
                name: categoryData.name,
                is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
            };

            return await apiService.post('/menu/categories', requestBody);
        } catch (error) {
            console.error('Failed to create category:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Редактирование категории
    async updateCategory(categoryId, categoryData) {
        try {
            const requestBody = {};

            if (categoryData.name !== undefined) requestBody.name = categoryData.name;
            if (categoryData.is_active !== undefined) requestBody.is_active = categoryData.is_active;

            return await apiService.patch(`/menu/categories/${categoryId}`, requestBody);
        } catch (error) {
            console.error('Failed to update category:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Удаление категории
    async deleteCategory(categoryId) {
        try {
            return await apiService.delete(`/menu/categories/${categoryId}`);
        } catch (error) {
            console.error('Failed to delete category:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Получение товаров категории
    async getCategoryProducts(categoryId, onlyActive = false) {
        try {
            const products = await apiService.get(`/menu/categories/${categoryId}/products?only_active=${onlyActive}`);
            return products.map(product => this.enrichProductData(product));
        } catch (error) {
            console.error('Failed to get category products:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Добавление товаров в категорию
    async addProductsToCategory(categoryId, productIds) {
        try {
            const requestBody = {
                products_id: productIds
            };

            return await apiService.patch(`/menu/categories/${categoryId}/products`, requestBody);
        } catch (error) {
            console.error('Failed to add products to category:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Удаление товара из категории
    async removeProductFromCategory(categoryId, productId) {
        try {
            return await apiService.delete(`/menu/categories/${categoryId}/products/${productId}`);
        } catch (error) {
            console.error('Failed to remove product from category:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    // Проверка, является ли тип товара маркированным
    isMarkedProductType(type) {
        return this.markedProductTypes.includes(type);
    }

    // Получение параметров по умолчанию для типа товара
    getDefaultParamsForProductType(type, measure) {
        const params = {
            qty_min: 1,
            qty_default: 1,
            qty_max: 999
        };

        if (this.isMarkedProductType(type)) {
            // Маркированные товары - только штуки, максимум 1
            params.qty_measure = 'PIECES';
            params.qty_max = 1;
            params.qty_default = 1;
        } else if (measure === 'GRAMS') {
            // Весовые товары
            params.qty_measure = 'GRAMS';
            params.qty_max = 30000;
            params.qty_default = 1000; // 1 кг по умолчанию
        } else {
            // Обычные штучные товары
            params.qty_measure = 'PIECES';
            params.qty_max = 999;
            params.qty_default = 1;
        }

        return params;
    }

    // Получение текста для типа товара
    getProductTypeText(type) {
        const types = {
            'NORMAL': 'Обычный',
            'WATER_MARKED': 'Вода (маркировка)',
            'DAIRY_MARKED': 'Молочка (маркировка)',
            'JUICE_MARKED': 'Сок (маркировка)',
            'NOT_ALCOHOL_BEER_MARKED': 'Пиво безалкогольное (маркировка)'
        };
        return types[type] || type;
    }

    // Получение текста для налога
    getTaxText(tax) {
        const taxes = {
            'NO_VAT': 'Без НДС',
            'VAT_18': 'НДС 18%'
        };
        return taxes[tax] || tax;
    }

    // Получение текста для единицы измерения
    getMeasureText(measure) {
        const measures = {
            'PIECES': 'шт',
            'GRAMS': 'г'
        };
        return measures[measure] || measure;
    }

    // Форматирование цены для отображения
    formatPrice(product) {
        if (product.qty_measure === 'GRAMS' && product.qty_default > 0) {
            // Для весовых товаров показываем цену за количество по умолчанию
            const price = (product.unit_price * product.qty_default / 1000).toFixed(2);
            return `${price} ₽`;
        } else {
            // Для штучных товаров показываем цену за штуку
            return `${product.unit_price.toFixed(2)} ₽`;
        }
    }

    // Получение полной информации о цене
    getPriceInfo(product) {
        if (product.qty_measure === 'GRAMS') {
            const defaultPrice = (product.unit_price * product.qty_default / 1000).toFixed(2);
            const kgPrice = (product.unit_price * 1000).toFixed(2);
            return {
                display: `${defaultPrice} ₽`,
                details: `(${kgPrice} ₽/кг)`
            };
        } else {
            return {
                display: `${product.unit_price.toFixed(2)} ₽`,
                details: ''
            };
        }
    }
}

window.menuService = new MenuService();