<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Navbar extends Component
{
    public $navItems = [];
    /**
     * Create a new component instance.
     */
    public function __construct()
    {
        $this->navItems = collect(config('navbar'))->map(function ($item, $index) {
            if (isset($item['route'])) {
                $item['href'] = route($item['route']);
                unset($item['route']);
            }
            $item['blank'] = $item['blank'] ?? false;
            $item['mobileHide'] = $item['mobileHide'] ?? false;

            return $item;
        })
            ->values()
            ->toArray();
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('components.navbar');
    }
}
