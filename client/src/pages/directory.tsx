import React from 'react';
import { Layout } from '@/components/layout';
import { useTraining } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function EmployeeDirectory() {
  const { users } = useTraining();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-primary">Employee Directory</h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow overflow-hidden group">
              <div className="h-24 bg-gradient-to-r from-primary to-secondary" />
              <CardContent className="pt-0 relative">
                <div className="absolute -top-12 left-6 border-4 border-background rounded-full">
                  <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full bg-white" />
                </div>
                
                <div className="mt-14 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{user.name}</h3>
                    <p className="text-sm text-secondary font-medium capitalize">{user.role}</p>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      +1 (555) 000-0000
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Houston, TX
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
