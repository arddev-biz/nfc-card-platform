import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {creationHistory,leadAge} from '@/lib/admin-overview';
const mock=vi.hoisted(()=>({orgs:vi.fn(),leads:vi.fn(),count:vi.fn(),groups:vi.fn(),profiles:vi.fn()}));
vi.mock('@/lib/services/organizations',()=>({listOrganizations:mock.orgs}));
vi.mock('@/lib/services/leads',()=>({listLeads:mock.leads}));
vi.mock('@/lib/db',()=>({db:{nFCCard:{count:mock.count,groupBy:mock.groups},businessProfile:{findMany:mock.profiles}}}));
import Page from '@/app/admin/(protected)/page';
it('counts UTC creation dates without future records',()=>{
 const now=new Date('2026-10-04T12:00:00Z');
 const history=creationHistory([{createdAt:new Date('2026-09-30T23:59:59Z')},{createdAt:new Date('2026-10-01T00:00:00Z')},{createdAt:new Date('2026-10-05T00:00:00Z')}],[],now);
 expect(history).toHaveLength(12);expect(history[10]).toEqual({label:'Sep',businesses:1,leads:0});expect(history[11]).toEqual({label:'Oct',businesses:1,leads:0});
 expect(leadAge(new Date('2026-10-05'),now)).toBe('Just now');
});
it('renders real counts, routes, business status and separate unseen state',async()=>{
 mock.orgs.mockResolvedValue([{id:'org',name:'Real business',slug:'real',businessType:'Cafe',status:'ACTIVE',createdAt:new Date(),subscription:null}]);
 mock.leads.mockResolvedValue([{id:'lead',name:'Real lead',email:null,phone:'123',status:'CONTACTED',seenAt:null,createdAt:new Date()}]);
 mock.count.mockResolvedValue(7);mock.groups.mockResolvedValue([{organizationId:'org',_count:{_all:8}}]);mock.profiles.mockResolvedValue([]);
 const html=renderToStaticMarkup(await Page());
 expect(mock.count).toHaveBeenCalledWith({where:{status:'ACTIVE'}});expect(html).toContain('>7<');expect(html).toContain('>8<');expect(html).toContain('/admin/businesses/org');expect(html).toContain('/admin/leads/lead');expect(html).toContain('Unseen');expect(html).toContain('Contacted');expect(html).toContain('No performance data yet');expect(html).not.toContain('12,438');expect(html).not.toContain('View Plans');
});
it('supports empty data without fabricated rows',async()=>{
 mock.orgs.mockResolvedValue([]);mock.leads.mockResolvedValue([]);mock.count.mockResolvedValue(0);mock.groups.mockResolvedValue([]);mock.profiles.mockResolvedValue([]);
 const html=renderToStaticMarkup(await Page());expect(html).toContain('No businesses yet');expect(html).toContain('No inquiries yet');
});
