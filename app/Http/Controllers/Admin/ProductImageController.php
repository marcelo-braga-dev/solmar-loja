<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\ProductImage;
use App\Domains\Catalog\Services\ProductService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ProductImageController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
    ) {}

    public function store(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'image'    => ['required', 'image', 'max:5120'], // 5 MB
            'is_cover' => ['boolean'],
        ]);

        $image = $this->productService->uploadImage(
            product: $product,
            file: $request->file('image'),
            isCover: $request->boolean('is_cover'),
        );

        return response()->json([
            'id'       => $image->id,
            'url'      => $image->url(),
            'alt'      => $image->alt,
            'position' => $image->position,
            'is_cover' => $image->is_cover,
        ], 201);
    }

    public function destroy(Product $product, ProductImage $image): RedirectResponse
    {
        abort_if($image->product_id !== $product->id, 403);

        $this->productService->deleteImage($image);

        return back()->with('success', 'Imagem removida.');
    }

    public function reorder(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        foreach ($request->array('ids') as $position => $id) {
            $product->images()->where('id', $id)->update(['position' => $position]);
        }

        return response()->json(['ok' => true]);
    }
}
