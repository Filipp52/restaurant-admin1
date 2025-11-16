// Сервис работы с меню (товары, категории, топпинги)
class MenuService {
    // ========== РАБОТА С ТОВАРАМИ ==========

    // Получение всех товаров
    async getProducts(onlyActive = false) {
        try {
            return await apiService.get(`/menu/products?only_active=${onlyActive}`);
        } catch (error) {
            console.error('Failed to get products:', error);
            throw error;
        }
    }

    // Получение товара по ID
    async getProduct(productId) {
        try {
            return await apiService.get(`/menu/products/${productId}`);
        } catch (error) {
            console.error('Failed to get product:', error);
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

            const requestBody = {
                name: productData.name,
                type: productData.type,
                tax: productData.tax,
                qty_measure: productData.qty_measure,
                qty_min: productData.qty_min,
                qty_max: productData.qty_max,
                qty_default: productData.qty_default,
                unit_price: parseFloat(productData.unit_price),
                is_active: productData.is_active !== undefined ? productData.is_active : true
            };

            return await apiService.post('/menu/products', requestBody);
        } catch (error) {
            console.error('Failed to create product:', error);
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
            throw error;
        }
    }

    // Удаление товара
    async deleteProduct(productId) {
        try {
            return await apiService.delete(`/menu/products/${productId}`);
        } catch (error) {
            console.error('Failed to delete product:', error);
            throw error;
        }
    }

    // Загрузка изображения товара
    async uploadProductImage(productId, file) {
        try {
            return await apiService.uploadFile(`/menu/products/${productId}/image`, file);
        } catch (error) {
            console.error('Failed to upload product image:', error);
            throw error;
        }
    }

    // Получение информации об изображении товара
    async getProductImageInfo(productId) {
        try {
            return await apiService.get(`/menu/products/${productId}/image/info`);
        } catch (error) {
            console.error('Failed to get product image info:', error);
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
            throw error;
        }
    }

    // Получение категории по ID
    async getCategory(categoryId) {
        try {
            return await apiService.get(`/menu/categories/${categoryId}`);
        } catch (error) {
            console.error('Failed to get category:', error);
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
            throw error;
        }
    }

    // Удаление категории
    async deleteCategory(categoryId) {
        try {
            return await apiService.delete(`/menu/categories/${categoryId}`);
        } catch (error) {
            console.error('Failed to delete category:', error);
            throw error;
        }
    }

    // Получение товаров категории
    async getCategoryProducts(categoryId, onlyActive = false) {
        try {
            return await apiService.get(`/menu/categories/${categoryId}/products?only_active=${onlyActive}`);
        } catch (error) {
            console.error('Failed to get category products:', error);
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
            throw error;
        }
    }

    // Удаление товара из категории
    async removeProductFromCategory(categoryId, productId) {
        try {
            return await apiService.delete(`/menu/categories/${categoryId}/products/${productId}`);
        } catch (error) {
            console.error('Failed to remove product from category:', error);
            throw error;
        }
    }

    // ========== РАБОТА С ТОППИНГАМИ ==========

    // Получение топпингов для продукта
    async getProductToppings(productId, onlyActive = false) {
        try {
            return await apiService.get(`/menu/product_toppings?product_id=${productId}&only_active=${onlyActive}`);
        } catch (error) {
            console.error('Failed to get product toppings:', error);
            throw error;
        }
    }

    // Создание топпинга
    async createTopping(toppingData) {
        try {
            const requiredFields = ['product_id', 'name', 'qty_measure', 'qty_min', 'qty_max', 'qty_default', 'unit_price'];
            const missingFields = requiredFields.filter(field => !toppingData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            }

            const requestBody = {
                product_id: toppingData.product_id,
                name: toppingData.name,
                qty_measure: toppingData.qty_measure,
                qty_min: toppingData.qty_min,
                qty_max: toppingData.qty_max,
                qty_default: toppingData.qty_default,
                unit_price: parseFloat(toppingData.unit_price),
                is_active: toppingData.is_active !== undefined ? toppingData.is_active : true
            };

            return await apiService.post('/menu/product_toppings', requestBody);
        } catch (error) {
            console.error('Failed to create topping:', error);
            throw error;
        }
    }

    // Редактирование топпинга
    async updateTopping(toppingId, toppingData) {
        try {
            const requestBody = {};

            if (toppingData.name !== undefined) requestBody.name = toppingData.name;
            if (toppingData.qty_min !== undefined) requestBody.qty_min = toppingData.qty_min;
            if (toppingData.qty_max !== undefined) requestBody.qty_max = toppingData.qty_max;
            if (toppingData.qty_default !== undefined) requestBody.qty_default = toppingData.qty_default;
            if (toppingData.unit_price !== undefined) requestBody.unit_price = parseFloat(toppingData.unit_price);
            if (toppingData.is_active !== undefined) requestBody.is_active = toppingData.is_active;

            return await apiService.patch(`/menu/product_toppings/${toppingId}`, requestBody);
        } catch (error) {
            console.error('Failed to update topping:', error);
            throw error;
        }
    }

    // Удаление топпинга
    async deleteTopping(toppingId) {
        try {
            return await apiService.delete(`/menu/product_toppings/${toppingId}`);
        } catch (error) {
            console.error('Failed to delete topping:', error);
            throw error;
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

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

    // Форматирование цены
    formatPrice(price, measure) {
        if (measure === 'GRAMS') {
            return `${(price * 1000).toFixed(2)} ₽/кг`;
        }
        return `${price.toFixed(2)} ₽`;
    }
}

window.menuService = new MenuService();