import React from 'react';
import { Sparkles, ShoppingBag, Video, Package } from 'lucide-react';
import { useStore } from '../lib/store';
import { CreateProductPanel } from './CreateProductPanel';
import { cn } from '../lib/utils';
import { Card, CardBody, CardFooter, Button, Chip } from '@heroui/react';

export function MainWorkspace() {
  const { 
    setShowDirector,
    setShowCreateProduct,
    savedProducts
  } = useStore();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <CreateProductPanel />
      
      {/* Business Tech Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-5xl">
          {/* Simple Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-slate-900 mb-4 tracking-tight">
              创作你的专业视频
            </h1>
            <p className="text-lg text-slate-600">
              从上传商品到 AI 生成，只需三步
            </p>
          </div>

          {/* Main Action Cards - Business Tech */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            <Card 
              isPressable
              onPress={() => setShowCreateProduct(true)}
              className="group hover:scale-[1.02] transition-transform"
            >
              <CardBody className="p-8">
                <div className="flex flex-col">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-tech transition-colors shadow-lg">
                    <ShoppingBag size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">创建商品</h3>
                  <p className="text-sm text-slate-600 mb-4">上传商品图片，填写商品信息</p>
                </div>
              </CardBody>
              <CardFooter>
                <Chip 
                  color={savedProducts.length > 0 ? "primary" : "default"}
                  variant="flat"
                >
                  {savedProducts.length > 0 ? `${savedProducts.length} 个商品` : '开始创建'}
                </Chip>
              </CardFooter>
            </Card>

            <Card
              isPressable={savedProducts.length > 0}
              onPress={() => {
                if (savedProducts.length === 0) {
                  alert('请先创建商品！\n\n点击左侧"创建商品"开始，或前往"我的商品"页面。');
                  return;
                }
                setShowDirector(true);
              }}
              className={cn(
                "group transition-transform",
                savedProducts.length > 0 ? "hover:scale-[1.02]" : "opacity-60 cursor-not-allowed"
              )}
            >
              <CardBody className="p-8">
                <div className="flex flex-col">
                  <div className={cn(
                    "w-14 h-14 rounded-lg flex items-center justify-center mb-4 shadow-lg transition-colors",
                    savedProducts.length > 0 ? "bg-tech group-hover:bg-tech-hover" : "bg-slate-300"
                  )}>
                    <Video size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">开始创作</h3>
                  <p className="text-sm text-slate-600 mb-4">选择商品，AI 生成专业视频</p>
                </div>
              </CardBody>
              <CardFooter>
                <Chip 
                  color={savedProducts.length > 0 ? "primary" : "default"}
                  variant={savedProducts.length > 0 ? "shadow" : "flat"}
                  className={savedProducts.length > 0 ? "animate-pulse" : ""}
                >
                  {savedProducts.length > 0 ? '点击开始创作' : '需要先创建商品'}
                </Chip>
              </CardFooter>
            </Card>
          </div>

          {/* Process Steps - Clean Business Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="border-2">
              <CardBody className="p-6">
                <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">创建商品</h3>
                <p className="text-sm text-slate-600">上传图片，填写商品信息</p>
              </CardBody>
            </Card>
            
            <Card className="border-2">
              <CardBody className="p-6">
                <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">配置参数</h3>
                <p className="text-sm text-slate-600">选择风格，设置视频参数</p>
              </CardBody>
            </Card>
            
            <Card className="border-2 border-primary bg-primary-50/30">
              <CardBody className="p-6">
                <div className="w-10 h-10 rounded-md bg-tech text-white flex items-center justify-center font-bold text-lg mb-4 shadow-lg">
                  3
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">AI 生成</h3>
                <p className="text-sm text-slate-600">一键生成专业营销视频</p>
              </CardBody>
            </Card>
          </div>

          {/* Quick Tip */}
          {savedProducts.length === 0 && (
            <Card className="bg-primary-50/50 border-primary/30">
              <CardBody className="p-5 flex flex-row gap-3 items-start">
                <div className="w-10 h-10 rounded-md bg-tech flex items-center justify-center shrink-0 shadow-sm">
                  <Package className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">开始使用</p>
                  <p className="text-sm text-slate-600">
                    点击上方“创建商品”按钮，上传商品图片并填写信息，即可开始 AI 视频创作
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
